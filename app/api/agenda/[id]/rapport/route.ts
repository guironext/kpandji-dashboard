import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, executeWithRetry } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/actions/user";
import {
  loadAgendaForUser,
  normalizeReport,
  parseIsoDate,
  serializedRapportFor,
  type StructuredReport,
} from "@/lib/assistante/rapport-serialization";

export const dynamic = "force-dynamic";

async function resolveUserId() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { error: "Non autorisé. Veuillez vous reconnecter." };
  const userResult = await getOrCreateUser(clerkId);
  if (!userResult.success || !userResult.data) {
    return { error: "Utilisateur introuvable." };
  }
  return { userId: userResult.data.id };
}

/**
 * Pushes list sections of the form into normalized Prisma tables.
 * `ListeParticipantQrCode` is intentionally not touched (managed by the QR / public API).
 */
function listRelationsFromReport(report: StructuredReport) {
  const presentRows = report.participants.presents
    .map((s) => s.trim())
    .filter(Boolean)
    .map((full) => {
      const parts = full.split(/\s+/);
      if (parts.length === 1) {
        return { nom: parts[0]!, prenoms: "" };
      }
      return {
        prenoms: parts.slice(0, -1).join(" "),
        nom: parts[parts.length - 1]!,
      };
    });

  const ordreCreates = report.ordreDuJour
    .map((o) => o.titre.trim())
    .filter(Boolean)
    .map((titre) => ({ ordreDuJour: titre }));

  const pointsCreates = report.deroulement
    .map((d) => ({
      pointAborde: d.titre.trim() || "—",
      resumePointsAbordes: d.resume.trim() || null,
      problemesPointsAbordes: d.problemes.trim() || null,
      propositionsPointsAbordes: d.propositions.trim() || null,
    }))
    .filter(
      (row) =>
        row.pointAborde !== "—" ||
        row.resumePointsAbordes ||
        row.problemesPointsAbordes ||
        row.propositionsPointsAbordes
    );

  const decisionCreates = report.decisions
    .map((t) => t.trim())
    .filter(Boolean)
    .map((decisionPrise) => ({ decisionPrise }));

  const actionCreates = report.actions
    .filter(
      (a) =>
        a.action.trim() ||
        a.responsable.trim() ||
        (a.echeance && a.echeance.trim())
    )
    .map((a) => ({
      actionAExecuter: a.action.trim() || "—",
      responsable: a.responsable.trim() || "—",
      dateExecution: parseIsoDate(a.echeance),
    }));

  return {
    forCreate: {
      listePresents: { create: presentRows },
      listeOrdreDuJour: { create: ordreCreates },
      listePointsAbordes: { create: pointsCreates },
      listeDecisionsPrises: { create: decisionCreates },
      listeActionsAExecuter: { create: actionCreates },
    },
    forUpdate: {
      listePresents: { deleteMany: {}, create: presentRows },
      listeOrdreDuJour: { deleteMany: {}, create: ordreCreates },
      listePointsAbordes: { deleteMany: {}, create: pointsCreates },
      listeDecisionsPrises: { deleteMany: {}, create: decisionCreates },
      listeActionsAExecuter: { deleteMany: {}, create: actionCreates },
    },
  };
}

// ---------- GET ----------

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

    const agenda = await loadAgendaForUser(id, r.userId);
    if (!agenda) {
      return NextResponse.json(
        { success: false, error: "Activité introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: agenda.rapportActiviteAgenda?.id ?? null,
        rapport: agenda.rapportActiviteAgenda
          ? serializedRapportFor(agenda.rapportActiviteAgenda)
          : "",
        createdAt: agenda.rapportActiviteAgenda?.createdAt ?? null,
        updatedAt: agenda.rapportActiviteAgenda?.updatedAt ?? null,
      },
    });
  } catch (error) {
    console.error("[GET /api/agenda/[id]/rapport]", error);
    const msg =
      error instanceof Error ? error.message : "Erreur lors du chargement";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

// ---------- PUT ----------

export async function PUT(
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

    let body: { rapport?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Corps de requête invalide" },
        { status: 400 }
      );
    }

    const raw = (body.rapport ?? "").toString();
    if (!raw.trim()) {
      return NextResponse.json(
        { success: false, error: "Le rapport ne peut pas être vide" },
        { status: 400 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
    const report = normalizeReport(parsed);

    const agenda = await loadAgendaForUser(id, r.userId);
    if (!agenda) {
      return NextResponse.json(
        { success: false, error: "Activité introuvable." },
        { status: 404 }
      );
    }

    const scalarData = {
      rapport: raw,
      userId: r.userId,
      lieu: report.header.lieu || null,
      organisateur: report.header.organisateur || null,
      redacteur: report.header.redacteur || null,
      contexte: report.objectif.contexte || null,
      butPrincipal: report.objectif.butPrincipal || null,
      difficulteProblemes: report.difficultes.problemes || null,
      difficulteRisques: report.difficultes.risques || null,
      actionsFutures: report.prochainesEtapes.actionsFutures || null,
      dateProchaine: parseIsoDate(report.prochainesEtapes.dateProchaine),
      conclusionResume: report.conclusion.resume || null,
      conclusionImpression: report.conclusion.impression || null,
      conclusionImportance: report.conclusion.importance || null,
    };

    const { forCreate, forUpdate } = listRelationsFromReport(report);

    const existingRapportId = agenda.rapportActiviteAgenda?.id;
    const { userId, ...createData } = scalarData;
    void userId;
    const saved = existingRapportId
      ? await executeWithRetry(() =>
          prisma.rapportActiviteAgenda.update({
            where: { id: existingRapportId },
            data: {
              ...scalarData,
              ...forUpdate,
            },
          })
        )
      : await executeWithRetry(() =>
          prisma.rapportActiviteAgenda.create({
            data: {
              ...createData,
              user: { connect: { id: r.userId } },
              agenda: { connect: { id: agenda.id } },
              ...forCreate,
            },
          })
        );

    return NextResponse.json({
      success: true,
      data: {
        id: saved.id,
        rapport: serializedRapportFor(saved),
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      },
    });
  } catch (error) {
    console.error("[PUT /api/agenda/[id]/rapport]", error);
    const msg =
      error instanceof Error
        ? error.message
        : "Erreur lors de l'enregistrement";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

// ---------- DELETE ----------

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

    const agenda = await loadAgendaForUser(id, r.userId);
    if (!agenda) {
      return NextResponse.json(
        { success: false, error: "Activité introuvable." },
        { status: 404 }
      );
    }
    const rapportRow = agenda.rapportActiviteAgenda;
    if (!rapportRow) {
      return NextResponse.json({ success: true });
    }

    await executeWithRetry(() =>
      prisma.rapportActiviteAgenda.delete({
        where: { id: rapportRow.id },
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/agenda/[id]/rapport]", error);
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
