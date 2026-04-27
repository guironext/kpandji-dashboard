import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/actions/user";
import {
  loadAgendaForUser,
  serializedRapportFor,
} from "./rapport-serialization";
import { serializeAgendaActivity, type AgendaActivityClient } from "./serialize-agenda-activity";

export type RapportClientPayload = {
  id: string | null;
  rapport: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type RapportPageInitial =
  | { status: "ok"; activity: AgendaActivityClient; rapport: RapportClientPayload }
  | { status: "unauthorized" }
  | { status: "not_found" };

/**
 * Data for RSC pages — no browser fetch, avoids `Failed to fetch` while Next compiles API routes in dev.
 */
export async function loadRapportPageInitialData(
  agendaId: string
): Promise<RapportPageInitial> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { status: "unauthorized" };
  const userResult = await getOrCreateUser(clerkId);
  if (!userResult.success || !userResult.data) {
    return { status: "unauthorized" };
  }
  const agenda = await loadAgendaForUser(agendaId, userResult.data.id);
  if (!agenda) return { status: "not_found" };

  const row = agenda.rapportActiviteAgenda;
  return {
    status: "ok",
    activity: serializeAgendaActivity(agenda),
    rapport: {
      id: row?.id ?? null,
      rapport: row ? serializedRapportFor(row) : "",
      createdAt: row?.createdAt?.toISOString() ?? null,
      updatedAt: row?.updatedAt?.toISOString() ?? null,
    },
  };
}
