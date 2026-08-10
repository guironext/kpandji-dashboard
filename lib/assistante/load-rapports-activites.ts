import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/actions/user";
import { prisma, executeWithRetry } from "@/lib/prisma";
import {
  serializedRapportFor,
} from "@/lib/assistante/rapport-serialization";
import { serializeAgendaActivity } from "@/lib/assistante/serialize-agenda-activity";

export type RapportActiviteListRow = {
  id: string;
  agendaId: string;
  titre: string;
  date: string;
  lieu: string | null;
  organisateur: string | null;
};

export type RapportActiviteDetailPayload = {
  activity: ReturnType<typeof serializeAgendaActivity>;
  rapportSerialized: string;
  updatedAt: string;
};

export async function loadRapportsActivitesList(): Promise<
  | { status: "ok"; rows: RapportActiviteListRow[] }
  | { status: "unauthorized" }
> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { status: "unauthorized" };
  const userResult = await getOrCreateUser(clerkId);
  if (!userResult.success || !userResult.data) {
    return { status: "unauthorized" };
  }
  const userId = userResult.data.id;

  const items = await executeWithRetry(() =>
    prisma.rapportActiviteAgenda.findMany({
      where: { agenda: { userId } },
      include: { agenda: true },
      orderBy: { updatedAt: "desc" },
    })
  );

  const rows: RapportActiviteListRow[] = items.map((r) => ({
    id: r.id,
    agendaId: r.agendaId,
    titre: r.agenda.titre,
    date: r.agenda.date.toISOString(),
    lieu: r.lieu ?? r.agenda.lieu,
    organisateur: r.organisateur,
  }));

  return { status: "ok", rows };
}

export async function loadRapportActiviteDetail(
  rapportId: string
): Promise<
  | { status: "ok"; data: RapportActiviteDetailPayload }
  | { status: "unauthorized" }
  | { status: "not_found" }
> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { status: "unauthorized" };
  const userResult = await getOrCreateUser(clerkId);
  if (!userResult.success || !userResult.data) {
    return { status: "unauthorized" };
  }
  const userId = userResult.data.id;

  const row = await executeWithRetry(() =>
    prisma.rapportActiviteAgenda.findUnique({
      where: { id: rapportId },
      include: { agenda: true },
    })
  );
  if (!row) return { status: "not_found" };
  if (row.agenda.userId !== userId) return { status: "not_found" };

  return {
    status: "ok",
    data: {
      activity: serializeAgendaActivity(row.agenda),
      rapportSerialized: serializedRapportFor(row),
      updatedAt: row.updatedAt.toISOString(),
    },
  };
}
