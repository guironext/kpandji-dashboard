import { prisma, executeWithRetry } from "@/lib/prisma";
import { type StructuredReport, normalizeReport } from "./rapport-structured";

export type {
  AbsentParticipant,
  AgendaPoint,
  DeroulementPoint,
  ActionItem,
  StructuredReport,
} from "./rapport-structured";
export { normalizeReport } from "./rapport-structured";

export async function loadAgendaForUser(id: string, userId: string) {
  const agenda = await executeWithRetry(() =>
    prisma.agenda.findUnique({
      where: { id },
      include: { rapportActiviteAgenda: true },
    })
  );
  if (!agenda || agenda.userId !== userId) return null;
  return agenda;
}

export const parseIsoDate = (value: string | null | undefined): Date | null => {
  if (!value || typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatIsoDate = (d: Date | null | undefined): string =>
  d ? d.toISOString().slice(0, 10) : "";

type LoadedRapport = NonNullable<
  Awaited<ReturnType<typeof loadAgendaForUser>>
>["rapportActiviteAgenda"];

function buildStructuredFromRow(row: NonNullable<LoadedRapport>): StructuredReport {
  const raw = row.rapport ?? "";
  if (!raw.trim()) {
    return {
      version: 1,
      header: {
        lieu: row.lieu ?? "",
        organisateur: row.organisateur ?? "",
        redacteur: row.redacteur ?? "",
      },
      participants: { presents: [], absents: [] },
      objectif: {
        contexte: row.contexte ?? "",
        butPrincipal: row.butPrincipal ?? "",
      },
      ordreDuJour: [],
      deroulement: [],
      decisions: [],
      actions: [],
      difficultes: {
        problemes: row.difficulteProblemes ?? "",
        risques: row.difficulteRisques ?? "",
      },
      prochainesEtapes: {
        actionsFutures: row.actionsFutures ?? "",
        dateProchaine: formatIsoDate(row.dateProchaine),
      },
      conclusion: {
        resume: row.conclusionResume ?? "",
        impression: row.conclusionImpression ?? "",
        importance: row.conclusionImportance ?? "",
      },
    };
  }
  try {
    const fromJson = normalizeReport(JSON.parse(raw));
    return {
      ...fromJson,
      header: {
        lieu: fromJson.header.lieu || row.lieu || "",
        organisateur: fromJson.header.organisateur || row.organisateur || "",
        redacteur: fromJson.header.redacteur || row.redacteur || "",
      },
      objectif: {
        contexte: fromJson.objectif.contexte || row.contexte || "",
        butPrincipal: fromJson.objectif.butPrincipal || row.butPrincipal || "",
      },
      difficultes: {
        problemes:
          fromJson.difficultes.problemes || row.difficulteProblemes || "",
        risques: fromJson.difficultes.risques || row.difficulteRisques || "",
      },
      prochainesEtapes: {
        actionsFutures:
          fromJson.prochainesEtapes.actionsFutures || row.actionsFutures || "",
        dateProchaine:
          fromJson.prochainesEtapes.dateProchaine ||
          formatIsoDate(row.dateProchaine),
      },
      conclusion: {
        resume: fromJson.conclusion.resume || row.conclusionResume || "",
        impression:
          fromJson.conclusion.impression || row.conclusionImpression || "",
        importance:
          fromJson.conclusion.importance || row.conclusionImportance || "",
      },
    };
  } catch {
    return {
      version: 1,
      header: {
        lieu: row.lieu ?? "",
        organisateur: row.organisateur ?? "",
        redacteur: row.redacteur ?? "",
      },
      participants: { presents: [], absents: [] },
      objectif: {
        contexte: row.contexte ?? "",
        butPrincipal: row.butPrincipal ?? "",
      },
      ordreDuJour: [],
      deroulement: [],
      decisions: [],
      actions: [],
      difficultes: {
        problemes: row.difficulteProblemes ?? "",
        risques: row.difficulteRisques ?? "",
      },
      prochainesEtapes: {
        actionsFutures: row.actionsFutures ?? "",
        dateProchaine: formatIsoDate(row.dateProchaine),
      },
      conclusion: {
        resume: row.conclusionResume ?? "",
        impression: row.conclusionImpression ?? "",
        importance: row.conclusionImportance ?? "",
      },
    };
  }
}

function structuredReportHasContent(s: StructuredReport): boolean {
  return (
    s.participants.presents.length > 0 ||
    s.participants.absents.length > 0 ||
    s.ordreDuJour.length > 0 ||
    s.deroulement.length > 0 ||
    s.decisions.length > 0 ||
    s.actions.length > 0 ||
    Boolean(s.header.lieu) ||
    Boolean(s.header.organisateur) ||
    Boolean(s.header.redacteur) ||
    Boolean(s.objectif.contexte) ||
    Boolean(s.objectif.butPrincipal) ||
    Boolean(s.difficultes.problemes) ||
    Boolean(s.difficultes.risques) ||
    Boolean(s.prochainesEtapes.actionsFutures) ||
    Boolean(s.prochainesEtapes.dateProchaine) ||
    Boolean(s.conclusion.resume) ||
    Boolean(s.conclusion.impression) ||
    Boolean(s.conclusion.importance)
  );
}

export function serializedRapportFor(row: NonNullable<LoadedRapport>): string {
  const raw = row.rapport ?? "";
  const structured = buildStructuredFromRow(row);
  if (structuredReportHasContent(structured)) {
    return JSON.stringify(structured);
  }
  if (raw.trim()) {
    try {
      JSON.parse(raw);
    } catch {
      return raw;
    }
    return raw;
  }
  return "";
}
