import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, executeWithRetry } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/actions/user";
import type { Agenda } from "@prisma/client";

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

function isValidYMD(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function isValidHM(s: unknown): s is string {
  return typeof s === "string" && /^\d{2}:\d{2}$/.test(s);
}

async function resolveUserId() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { error: "Non autorisé. Veuillez vous reconnecter." };
  const userResult = await getOrCreateUser(clerkId);
  if (!userResult.success || !userResult.data) {
    return { error: "Utilisateur introuvable." };
  }
  return { userId: userResult.data.id };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const r = await resolveUserId();
    if ("error" in r) {
      return NextResponse.json(
        { success: false, error: r.error },
        { status: 401 }
      );
    }

    const existing = await executeWithRetry(() =>
      prisma.agenda.findUnique({ where: { id } })
    );
    if (!existing || existing.userId !== r.userId) {
      return NextResponse.json(
        { success: false, error: "Activité introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeAgenda(existing),
    });
  } catch (error) {
    console.error("[GET /api/agenda/[id]]", error);
    const msg =
      error instanceof Error ? error.message : "Erreur lors du chargement";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const r = await resolveUserId();
    if ("error" in r) {
      return NextResponse.json(
        { success: false, error: r.error },
        { status: 401 }
      );
    }

    const existing = await executeWithRetry(() =>
      prisma.agenda.findUnique({ where: { id } })
    );
    if (!existing || existing.userId !== r.userId) {
      return NextResponse.json(
        { success: false, error: "Activité introuvable." },
        { status: 404 }
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

    const titre = body.titre?.toString().trim();
    if (body.titre !== undefined && !titre) {
      return NextResponse.json(
        { success: false, error: "Le titre est requis" },
        { status: 400 }
      );
    }
    if (body.date !== undefined && !isValidYMD(body.date)) {
      return NextResponse.json(
        { success: false, error: "La date est invalide (yyyy-MM-dd)" },
        { status: 400 }
      );
    }
    if (
      (body.startTime !== undefined && !isValidHM(body.startTime)) ||
      (body.endTime !== undefined && !isValidHM(body.endTime))
    ) {
      return NextResponse.json(
        { success: false, error: "Les heures sont invalides (HH:mm)" },
        { status: 400 }
      );
    }

    const currentDateStr = `${existing.date.getUTCFullYear()}-${pad(
      existing.date.getUTCMonth() + 1
    )}-${pad(existing.date.getUTCDate())}`;
    const currentStart = `${pad(existing.heureDebut.getUTCHours())}:${pad(
      existing.heureDebut.getUTCMinutes()
    )}`;
    const currentEnd = `${pad(existing.heureFin.getUTCHours())}:${pad(
      existing.heureFin.getUTCMinutes()
    )}`;

    const nextDate = body.date ?? currentDateStr;
    const nextStart = body.startTime ?? currentStart;
    const nextEnd = body.endTime ?? currentEnd;

    if (nextEnd <= nextStart) {
      return NextResponse.json(
        { success: false, error: "La fin doit être après le début" },
        { status: 400 }
      );
    }

    const updated = await executeWithRetry(() =>
      prisma.agenda.update({
        where: { id },
        data: {
          ...(titre !== undefined ? { titre } : {}),
          ...(body.description !== undefined
            ? { description: body.description?.toString().trim() || null }
            : {}),
          ...(body.lieu !== undefined
            ? { lieu: body.lieu?.toString().trim() || null }
            : {}),
          ...(body.color !== undefined ? { color: body.color.toString() } : {}),
          date: combineDateTime(nextDate, "00:00"),
          heureDebut: combineDateTime(nextDate, nextStart),
          heureFin: combineDateTime(nextDate, nextEnd),
        },
      })
    );

    return NextResponse.json({
      success: true,
      data: serializeAgenda(updated),
    });
  } catch (error) {
    console.error("[PATCH /api/agenda/[id]]", error);
    const msg =
      error instanceof Error
        ? error.message
        : "Erreur lors de la mise à jour";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const r = await resolveUserId();
    if ("error" in r) {
      return NextResponse.json(
        { success: false, error: r.error },
        { status: 401 }
      );
    }

    const existing = await executeWithRetry(() =>
      prisma.agenda.findUnique({ where: { id } })
    );
    if (!existing || existing.userId !== r.userId) {
      return NextResponse.json(
        { success: false, error: "Activité introuvable." },
        { status: 404 }
      );
    }

    await executeWithRetry(() => prisma.agenda.delete({ where: { id } }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/agenda/[id]]", error);
    const msg =
      error instanceof Error
        ? error.message
        : "Erreur lors de la suppression";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
