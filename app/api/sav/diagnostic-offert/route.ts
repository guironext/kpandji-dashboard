import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const offertInclude = {
  voitureSAV: {
    select: {
      id: true,
      model: true,
      immatriculation: true,
      chassisNumber: true,
    },
  },
} as const;

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function resolveLibelle(body: {
  libelle?: unknown;
  detailDiagnosticId?: unknown;
}): Promise<{ libelle: string; error?: string }> {
  const detailDiagnosticId =
    typeof body.detailDiagnosticId === "string" && body.detailDiagnosticId.trim()
      ? body.detailDiagnosticId.trim()
      : null;

  if (detailDiagnosticId) {
    const detail = await prisma.detailDiagnostic.findUnique({
      where: { id: detailDiagnosticId },
      select: { nom: true },
    });
    if (!detail) {
      return { libelle: "", error: "Détail diagnostique introuvable" };
    }
    return { libelle: detail.nom };
  }

  const libelle = typeof body.libelle === "string" ? body.libelle.trim() : "";
  return { libelle };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const voitureSAVId = searchParams.get("voitureSAVId");
    const activeOnly = searchParams.get("active") === "1";

    const now = new Date();
    const items = await prisma.diagnosticOffert.findMany({
      where: {
        ...(voitureSAVId
          ? {
              OR: [{ voitureSAVId }, { voitureSAVId: null }],
            }
          : {}),
        ...(activeOnly
          ? {
              date_activation: { lte: now },
              date_fin: { gte: now },
            }
          : {}),
      },
      include: offertInclude,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("API getDiagnosticOffert error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors du chargement",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const resolved = await resolveLibelle(body);
    if (resolved.error) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: 400 }
      );
    }
    const libelle = resolved.libelle;
    const date_activation = parseDate(body.date_activation);
    const date_fin = parseDate(body.date_fin);
    const voitureSAVId =
      typeof body.voitureSAVId === "string" && body.voitureSAVId.trim()
        ? body.voitureSAVId.trim()
        : null;

    if (!libelle) {
      return NextResponse.json(
        { success: false, error: "Sélectionnez un détail diagnostique" },
        { status: 400 }
      );
    }
    if (!date_activation || !date_fin) {
      return NextResponse.json(
        { success: false, error: "Les dates d'activation et de fin sont requises" },
        { status: 400 }
      );
    }
    if (date_fin < date_activation) {
      return NextResponse.json(
        { success: false, error: "La date de fin doit être postérieure à la date d'activation" },
        { status: 400 }
      );
    }

    const item = await prisma.diagnosticOffert.create({
      data: {
        libelle,
        date_activation,
        date_fin,
        voitureSAVId,
      },
      include: offertInclude,
    });
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("API createDiagnosticOffert error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors de la création",
      },
      { status: 500 }
    );
  }
}
