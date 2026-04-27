/**
 * Pure types + normalize — safe to import from client components.
 * (Do not import `rapport-serialization.ts` in "use client" — it pulls Prisma.)
 */

export type AbsentParticipant = { name: string; excused: boolean };
export type AgendaPoint = { titre: string };
export type DeroulementPoint = {
  titre: string;
  resume: string;
  problemes: string;
  propositions: string;
};
export type ActionItem = {
  action: string;
  responsable: string;
  echeance: string;
};

export type StructuredReport = {
  version: 1;
  header: { lieu: string; organisateur: string; redacteur: string };
  participants: { presents: string[]; absents: AbsentParticipant[] };
  objectif: { contexte: string; butPrincipal: string };
  ordreDuJour: AgendaPoint[];
  deroulement: DeroulementPoint[];
  decisions: string[];
  actions: ActionItem[];
  difficultes: { problemes: string; risques: string };
  prochainesEtapes: { actionsFutures: string; dateProchaine: string };
  conclusion: { resume: string; impression: string; importance: string };
};

const toStr = (v: unknown) => (typeof v === "string" ? v : "");

export function normalizeReport(raw: unknown): StructuredReport {
  const r = (raw ?? {}) as Partial<StructuredReport>;
  return {
    version: 1,
    header: {
      lieu: toStr(r.header?.lieu),
      organisateur: toStr(r.header?.organisateur),
      redacteur: toStr(r.header?.redacteur),
    },
    participants: {
      presents: Array.isArray(r.participants?.presents)
        ? r.participants!.presents.filter((x): x is string => typeof x === "string")
        : [],
      absents: Array.isArray(r.participants?.absents)
        ? r.participants!.absents.map((a) => ({
            name: toStr(a?.name),
            excused: Boolean(a?.excused),
          }))
        : [],
    },
    objectif: {
      contexte: toStr(r.objectif?.contexte),
      butPrincipal: toStr(r.objectif?.butPrincipal),
    },
    ordreDuJour: Array.isArray(r.ordreDuJour)
      ? r.ordreDuJour.map((p) => ({ titre: toStr(p?.titre) }))
      : [],
    deroulement: Array.isArray(r.deroulement)
      ? r.deroulement.map((p) => ({
          titre: toStr(p?.titre),
          resume: toStr(p?.resume),
          problemes: toStr(p?.problemes),
          propositions: toStr(p?.propositions),
        }))
      : [],
    decisions: Array.isArray(r.decisions)
      ? r.decisions.map((d) => toStr(d))
      : [],
    actions: Array.isArray(r.actions)
      ? r.actions.map((a) => ({
          action: toStr(a?.action),
          responsable: toStr(a?.responsable),
          echeance: toStr(a?.echeance),
        }))
      : [],
    difficultes: {
      problemes: toStr(r.difficultes?.problemes),
      risques: toStr(r.difficultes?.risques),
    },
    prochainesEtapes: {
      actionsFutures: toStr(r.prochainesEtapes?.actionsFutures),
      dateProchaine: toStr(r.prochainesEtapes?.dateProchaine),
    },
    conclusion: {
      resume: toStr(r.conclusion?.resume),
      impression: toStr(r.conclusion?.impression),
      importance: toStr(r.conclusion?.importance),
    },
  };
}
