import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma, executeWithRetry } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/actions/user";

export const dynamic = "force-dynamic";

// ---------- Helpers ----------

const sanitize = (v: unknown, max = 120): string =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";

const isValidPhone = (v: string): boolean => {
  // Accepte +, espaces, tirets, points et parenthèses; doit contenir au moins 6 chiffres.
  const digits = v.replace(/[^\d]/g, "");
  return digits.length >= 6 && digits.length <= 20;
};

const isValidEmail = (v: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/**
 * Résout (et crée si nécessaire) le RapportActiviteAgenda lié à l'activité donnée.
 *
 * L'auto-inscription via QR code doit fonctionner même si l'assistante n'a
 * pas encore ouvert le rapport : on crée un rapport vide rattaché à
 * l'agenda et à son propriétaire.
 *
 * Robuste aux accès concurrents : P2002 sur RapportActiviteAgenda.agendaId
 * unique — on relit l'id déjà créé par une autre requête.
 */
async function ensureRapportAgendaForAgenda(agendaId: string) {
  const agenda = await executeWithRetry(() =>
    prisma.agenda.findUnique({
      where: { id: agendaId },
      select: {
        id: true,
        titre: true,
        lieu: true,
        userId: true,
        rapportActiviteAgenda: { select: { id: true } },
      },
    })
  );
  if (!agenda) return null;

  const existingRapportId = agenda.rapportActiviteAgenda?.id;
  if (existingRapportId) {
    return { agenda, rapportAgendaId: existingRapportId };
  }

  try {
    const rapportAgendaId = await executeWithRetry(() =>
      prisma.$transaction(async (tx) => {
        const fresh = await tx.agenda.findUnique({
          where: { id: agenda.id },
          select: {
            rapportActiviteAgenda: { select: { id: true } },
            userId: true,
            lieu: true,
          },
        });
        if (fresh?.rapportActiviteAgenda?.id) {
          return fresh.rapportActiviteAgenda.id;
        }

        const created = await tx.rapportActiviteAgenda.create({
          data: {
            user: { connect: { id: fresh?.userId ?? agenda.userId } },
            lieu: (fresh?.lieu ?? agenda.lieu) ?? null,
            agenda: { connect: { id: agenda.id } },
          },
          select: { id: true },
        });
        return created.id;
      })
    );

    return { agenda, rapportAgendaId };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const reread = await executeWithRetry(() =>
        prisma.agenda.findUnique({
          where: { id: agenda.id },
          select: { rapportActiviteAgenda: { select: { id: true } } },
        })
      );
      const id = reread?.rapportActiviteAgenda?.id;
      if (id) {
        return { agenda, rapportAgendaId: id };
      }
    }
    throw err;
  }
}

function prismaErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return `${fallback} (Prisma ${err.code})`;
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return `${fallback} (validation Prisma)`;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

// ---------- GET : liste des participants inscrits ----------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const agenda = await executeWithRetry(() =>
      prisma.agenda.findUnique({
        where: { id },
        select: {
          id: true,
          titre: true,
          lieu: true,
          date: true,
          heureDebut: true,
          heureFin: true,
          rapportActiviteAgenda: { select: { id: true } },
        },
      })
    );
    if (!agenda) {
      return NextResponse.json(
        { success: false, error: "Activité introuvable." },
        { status: 404 }
      );
    }

    const rapportId = agenda.rapportActiviteAgenda?.id;
    const rows = rapportId
      ? await executeWithRetry(() =>
          prisma.listeParticipantQrCode.findMany({
            where: { rapportActiviteAgendaId: rapportId },
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              nom: true,
              prenoms: true,
              telephone: true,
              email: true,
              createdAt: true,
            },
          })
        )
      : [];

    const participants = rows.map((p) => ({
      id: p.id,
      nom: p.nom,
      prenom: p.prenoms,
      telephone: p.telephone ?? "",
      email: p.email,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        activity: {
          id: agenda.id,
          titre: agenda.titre,
          lieu: agenda.lieu,
          date: agenda.date,
          heureDebut: agenda.heureDebut,
          heureFin: agenda.heureFin,
        },
        participants,
      },
    });
  } catch (error) {
    console.error("[GET /api/public/participants/[id]]", error);
    const msg = prismaErrorMessage(error, "Erreur lors du chargement");
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ---------- POST : auto-inscription ----------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let body: unknown;
    try {
      // NextRequest.json() peut échouer dans certains contextes (proxy, outils CLI, etc.).
      // On parse manuellement pour être plus robuste.
      const text = await request.text();
      body = text ? JSON.parse(text) : null;
    } catch {
      return NextResponse.json(
        { success: false, error: "Corps de requête invalide." },
        { status: 400 }
      );
    }

    const b = (body ?? {}) as {
      nom?: unknown;
      prenom?: unknown;
      telephone?: unknown;
      email?: unknown;
    };

    const nom = sanitize(b.nom, 80);
    const prenom = sanitize(b.prenom, 80);
    const telephone = sanitize(b.telephone, 30);
    const emailRaw = sanitize(b.email, 160);
    const email = emailRaw.toLowerCase();

    if (!nom || !prenom) {
      return NextResponse.json(
        { success: false, error: "Nom et prénom sont obligatoires." },
        { status: 400 }
      );
    }
    if (!telephone || !isValidPhone(telephone)) {
      return NextResponse.json(
        { success: false, error: "Numéro de téléphone invalide." },
        { status: 400 }
      );
    }
    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Adresse e-mail invalide." },
        { status: 400 }
      );
    }

    const resolved = await ensureRapportAgendaForAgenda(id);
    if (!resolved) {
      return NextResponse.json(
        { success: false, error: "Activité introuvable." },
        { status: 404 }
      );
    }

    const existing = await executeWithRetry(() =>
      prisma.listeParticipantQrCode.findFirst({
        where: {
          rapportActiviteAgendaId: resolved.rapportAgendaId,
          telephone,
        },
        select: { id: true },
      })
    );
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Ce numéro est déjà inscrit pour cette rencontre.",
        },
        { status: 409 }
      );
    }

    const created = await executeWithRetry(() =>
      prisma.listeParticipantQrCode.create({
        data: {
          nom,
          prenoms: prenom,
          telephone,
          email: email || null,
          rapportActiviteAgenda: {
            connect: { id: resolved.rapportAgendaId },
          },
        },
        select: {
          id: true,
          nom: true,
          prenoms: true,
          telephone: true,
          email: true,
          createdAt: true,
        },
      })
    );

    console.log(
      `[POST /api/public/participants/${id}] ok id=${created.id} phone=${telephone}`
    );
    return NextResponse.json({
      success: true,
      data: {
        id: created.id,
        nom: created.nom,
        prenom: created.prenoms,
        telephone: created.telephone ?? "",
        email: created.email,
        createdAt: created.createdAt,
      },
    });
  } catch (error) {
    console.error("[POST /api/public/participants/[id]]", error);
    const msg = prismaErrorMessage(error, "Erreur lors de l'inscription");
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ---------- DELETE : suppression d'un participant (assistante authentifiée) ----------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const participantId = request.nextUrl.searchParams.get("participantId");
    if (!participantId) {
      return NextResponse.json(
        { success: false, error: "Paramètre participantId manquant." },
        { status: 400 }
      );
    }

    // Cette opération est réservée au propriétaire de l'agenda : on exige un
    // utilisateur authentifié et on vérifie qu'il en est bien l'auteur.
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { success: false, error: "Non autorisé." },
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

    const agenda = await executeWithRetry(() =>
      prisma.agenda.findUnique({
        where: { id },
        select: {
          id: true,
          userId: true,
          rapportActiviteAgenda: { select: { id: true } },
        },
      })
    );
    if (!agenda || agenda.userId !== userResult.data.id) {
      return NextResponse.json(
        { success: false, error: "Activité introuvable." },
        { status: 404 }
      );
    }
    const rapportId = agenda.rapportActiviteAgenda?.id;
    if (!rapportId) {
      return NextResponse.json(
        { success: false, error: "Aucun participant inscrit." },
        { status: 404 }
      );
    }

    await executeWithRetry(() =>
      prisma.listeParticipantQrCode.deleteMany({
        where: {
          id: participantId,
          rapportActiviteAgendaId: rapportId,
        },
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/public/participants/[id]]", error);
    const msg = prismaErrorMessage(error, "Erreur lors de la suppression");
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
