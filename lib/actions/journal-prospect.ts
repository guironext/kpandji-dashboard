"use server";

import { prisma, executeWithRetry } from "@/lib/prisma";

export type JournalProspectKind = "CLIENT" | "CLIENT_ENTREPRISE";

export type JournalProspectItem = {
  id: string;
  kind: JournalProspectKind;
  clientId: string;
  heure: string | null;
  typeContact: string | null;
  nomEntreprise: string;
  secteurActivite: string | null;
  interlocuteur: string | null;
  fonction: string | null;
  telephone: string | null;
  email: string | null;
  tailleParcEquipements: string | null;
  besoinIdentifie: string | null;
  statutEtape: string | null;
  actionSuivante: string | null;
  dateRelance: string | null;
  commentaires: string | null;
  resume: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JournalProspectCommercial = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type JournalProspectsByCommercial = {
  commercial: JournalProspectCommercial;
  prospects: JournalProspectItem[];
};

export type JournalProspectsResult = {
  success: boolean;
  error?: string;
  data?: {
    groups: JournalProspectsByCommercial[];
    totalProspects: number;
    totalCommercials: number;
  };
};

const UNASSIGNED_COMMERCIAL: JournalProspectCommercial = {
  id: "__unassigned__",
  firstName: "Non",
  lastName: "assigné",
  email: "",
};

type RapportSnippet = {
  heure_rendez_vous: string;
  date_rendez_vous: Date;
  typeContact: string | null;
  tailleParcEquipements: string | null;
  besoinIdentifie: string | null;
  etapeDesEchanges: string | null;
  suivi_actions: string | null;
  actions_suivi: unknown;
  commentaire_global: string | null;
  nom_prenom_client: string;
  telephone_client: string;
  email_client: string | null;
  profession_societe: string | null;
  RendezVous: { resume_rendez_vous: string | null } | null;
};

type JournalSnippet = {
  userId: string;
  heure: Date;
  typeContact: string;
  nomEntreprise: string;
  secteurActivite: string | null;
  interlocuteur: string | null;
  fonction: string | null;
  telephone: string | null;
  email: string | null;
  tailleParcEquipements: string | null;
  besoinIdentifie: string | null;
  statutEtape: string;
  actionSuivante: string | null;
  dateRelance: Date | null;
  commentaires: string | null;
  resume: string | null;
};

function firstNonEmpty(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function normalizePhone(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

function normalizeName(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function combineDateAndTime(date: Date, time: string | null | undefined) {
  const combined = new Date(date);
  const match = time?.trim().match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    combined.setHours(Number(match[1]), Number(match[2]), 0, 0);
  }
  return combined.toISOString();
}

function extractRelance(
  actionsSuivi: unknown,
  suiviActions: string | null,
): { action: string | null; date: string | null } {
  let action = firstNonEmpty(suiviActions);
  let date: string | null = null;
  let parsed = actionsSuivi;

  if (typeof actionsSuivi === "string") {
    const trimmed = actionsSuivi.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        parsed = actionsSuivi;
      }
    }
  }

  const entries = Array.isArray(parsed) ? parsed : [];
  if (entries.length > 0) {
    const first = entries[0] as Record<string, unknown>;
    const label = [first.action, first.responsable]
      .filter((part) => typeof part === "string" && part.trim())
      .join(" · ");
    action = firstNonEmpty(action, label);
    if (typeof first.echeance === "string" && first.echeance.trim()) {
      date = first.echeance.trim();
    }
  }

  return { action, date };
}

function commercialFromUser(user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
} | null): JournalProspectCommercial {
  if (!user) return UNASSIGNED_COMMERCIAL;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
}

function findMatchingJournal(
  journals: JournalSnippet[],
  phone: string | null,
  names: Array<string | null | undefined>,
): JournalSnippet | null {
  const phoneKey = normalizePhone(phone);
  if (phoneKey) {
    const byPhone = journals.find(
      (entry) => normalizePhone(entry.telephone) === phoneKey,
    );
    if (byPhone) return byPhone;
  }

  const nameKeys = names.map(normalizeName).filter(Boolean);
  if (nameKeys.length === 0) return null;

  return (
    journals.find((entry) =>
      nameKeys.includes(normalizeName(entry.nomEntreprise)),
    ) ??
    journals.find((entry) =>
      nameKeys.includes(normalizeName(entry.interlocuteur)),
    ) ??
    null
  );
}

function buildProspect(params: {
  kind: JournalProspectKind;
  clientId: string;
  nomEntreprise: string;
  secteurActivite: string | null;
  interlocuteur: string | null;
  fonction: string | null;
  telephone: string | null;
  email: string | null;
  tailleParc: string | null;
  createdAt: Date;
  updatedAt: Date;
  rapport: RapportSnippet | null;
  journal: JournalSnippet | null;
}): JournalProspectItem {
  const { kind, clientId, rapport, journal } = params;
  const relance = extractRelance(
    rapport?.actions_suivi,
    rapport?.suivi_actions ?? null,
  );

  const heure = journal
    ? journal.heure.toISOString()
    : rapport
      ? combineDateAndTime(rapport.date_rendez_vous, rapport.heure_rendez_vous)
      : params.createdAt.toISOString();

  return {
    id: `${kind}:${clientId}`,
    kind,
    clientId,
    heure,
    typeContact: firstNonEmpty(journal?.typeContact, rapport?.typeContact),
    nomEntreprise: firstNonEmpty(
      params.nomEntreprise,
      journal?.nomEntreprise,
      rapport?.profession_societe,
    ) ?? params.nomEntreprise,
    secteurActivite: firstNonEmpty(
      params.secteurActivite,
      journal?.secteurActivite,
    ),
    interlocuteur: firstNonEmpty(
      params.interlocuteur,
      journal?.interlocuteur,
      rapport?.nom_prenom_client,
    ),
    fonction: firstNonEmpty(
      params.fonction,
      journal?.fonction,
      rapport?.profession_societe,
    ),
    telephone: firstNonEmpty(
      params.telephone,
      journal?.telephone,
      rapport?.telephone_client,
    ),
    email: firstNonEmpty(params.email, journal?.email, rapport?.email_client),
    tailleParcEquipements: firstNonEmpty(
      journal?.tailleParcEquipements,
      rapport?.tailleParcEquipements,
      params.tailleParc,
    ),
    besoinIdentifie: firstNonEmpty(
      journal?.besoinIdentifie,
      rapport?.besoinIdentifie,
    ),
    statutEtape: firstNonEmpty(
      journal?.statutEtape,
      rapport?.etapeDesEchanges,
    ),
    actionSuivante: firstNonEmpty(journal?.actionSuivante, relance.action),
    dateRelance:
      journal?.dateRelance?.toISOString() ??
      (relance.date && !Number.isNaN(Date.parse(relance.date))
        ? new Date(relance.date).toISOString()
        : relance.date),
    commentaires: firstNonEmpty(
      journal?.commentaires,
      rapport?.commentaire_global,
    ),
    resume: firstNonEmpty(
      journal?.resume,
      rapport?.RendezVous?.resume_rendez_vous,
    ),
    createdAt: params.createdAt.toISOString(),
    updatedAt: params.updatedAt.toISOString(),
  };
}

export async function getJournalProspectsByCommercial(): Promise<JournalProspectsResult> {
  try {
    const rapportSelect = {
      orderBy: { date_rendez_vous: "desc" as const },
      take: 1,
      select: {
        heure_rendez_vous: true,
        date_rendez_vous: true,
        typeContact: true,
        tailleParcEquipements: true,
        besoinIdentifie: true,
        etapeDesEchanges: true,
        suivi_actions: true,
        actions_suivi: true,
        commentaire_global: true,
        nom_prenom_client: true,
        telephone_client: true,
        email_client: true,
        profession_societe: true,
        RendezVous: {
          select: { resume_rendez_vous: true },
        },
      },
    };

    const userSelect = {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    };

    const [clients, entreprises] = await executeWithRetry(() =>
      Promise.all([
        prisma.client.findMany({
          where: { status_client: "PROSPECT" },
          include: {
            User: userSelect,
            RapportRendezVous: rapportSelect,
          },
          orderBy: { updatedAt: "desc" },
        }),
        prisma.client_entreprise.findMany({
          where: { status_client: "PROSPECT" },
          include: {
            User: userSelect,
            RapportRendezVous: rapportSelect,
          },
          orderBy: { updatedAt: "desc" },
        }),
      ]),
    );

    let journals: JournalSnippet[] = [];
    try {
      journals = await executeWithRetry(() =>
        prisma.journalProspect.findMany({
          orderBy: { heure: "desc" },
        }),
      );
    } catch (journalError) {
      console.warn(
        "JournalProspect enrichment skipped:",
        journalError instanceof Error ? journalError.message : journalError,
      );
    }

    const journalsByUser = new Map<string, JournalSnippet[]>();
    for (const entry of journals) {
      const list = journalsByUser.get(entry.userId) ?? [];
      list.push(entry);
      journalsByUser.set(entry.userId, list);
    }

    const grouped = new Map<string, JournalProspectsByCommercial>();

    const addProspect = (
      commercial: JournalProspectCommercial,
      prospect: JournalProspectItem,
    ) => {
      if (!grouped.has(commercial.id)) {
        grouped.set(commercial.id, { commercial, prospects: [] });
      }
      grouped.get(commercial.id)!.prospects.push(prospect);
    };

    for (const client of clients) {
      const commercial = commercialFromUser(client.User);
      const userJournals = journalsByUser.get(client.userId) ?? [];
      const journal = findMatchingJournal(userJournals, client.telephone, [
        client.entreprise,
        client.nom,
      ]);

      addProspect(
        commercial,
        buildProspect({
          kind: "CLIENT",
          clientId: client.id,
          nomEntreprise: firstNonEmpty(client.entreprise, client.nom) ?? client.nom,
          secteurActivite: client.secteur_activite,
          interlocuteur: client.nom,
          fonction: null,
          telephone: client.telephone,
          email: client.email,
          tailleParc: null,
          createdAt: client.createdAt,
          updatedAt: client.updatedAt,
          rapport: client.RapportRendezVous[0] ?? null,
          journal,
        }),
      );
    }

    for (const entreprise of entreprises) {
      const commercial = commercialFromUser(entreprise.User);
      const userJournals = journalsByUser.get(entreprise.userId) ?? [];
      const journal = findMatchingJournal(userJournals, entreprise.telephone, [
        entreprise.nom_entreprise,
        entreprise.sigle,
        entreprise.nom_personne_contact,
      ]);

      addProspect(
        commercial,
        buildProspect({
          kind: "CLIENT_ENTREPRISE",
          clientId: entreprise.id,
          nomEntreprise:
            firstNonEmpty(entreprise.nom_entreprise, entreprise.sigle) ??
            entreprise.nom_entreprise,
          secteurActivite: entreprise.secteur_activite,
          interlocuteur: entreprise.nom_personne_contact,
          fonction: entreprise.fonction_personne_contact,
          telephone: firstNonEmpty(
            entreprise.telephone_personne_contact,
            entreprise.telephone,
          ),
          email: firstNonEmpty(entreprise.email_personne_contact, entreprise.email),
          tailleParc: entreprise.flotte_vehicules_description,
          createdAt: entreprise.createdAt,
          updatedAt: entreprise.updatedAt,
          rapport: entreprise.RapportRendezVous[0] ?? null,
          journal,
        }),
      );
    }

    const groups = Array.from(grouped.values())
      .map((group) => ({
        ...group,
        prospects: group.prospects.sort((a, b) => {
          const timeA = a.heure ? Date.parse(a.heure) : 0;
          const timeB = b.heure ? Date.parse(b.heure) : 0;
          return timeB - timeA;
        }),
      }))
      .sort((a, b) => {
        if (a.commercial.id === UNASSIGNED_COMMERCIAL.id) return 1;
        if (b.commercial.id === UNASSIGNED_COMMERCIAL.id) return -1;
        const nameA = `${a.commercial.lastName} ${a.commercial.firstName}`.trim();
        const nameB = `${b.commercial.lastName} ${b.commercial.firstName}`.trim();
        return nameA.localeCompare(nameB, "fr");
      });

    const totalProspects = groups.reduce(
      (sum, group) => sum + group.prospects.length,
      0,
    );

    return {
      success: true,
      data: {
        groups,
        totalProspects,
        totalCommercials: groups.filter(
          (group) => group.commercial.id !== UNASSIGNED_COMMERCIAL.id,
        ).length,
      },
    };
  } catch (error) {
    console.error("Error fetching journal prospects:", error);
    return {
      success: false,
      error: "Impossible de charger le journal des prospects.",
    };
  }
}
