import type { Agenda } from "@prisma/client";

const pad = (n: number) => n.toString().padStart(2, "0");

/** Same shape as `GET /api/agenda/[id]`. */
export function serializeAgendaActivity(a: Agenda) {
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

export type AgendaActivityClient = ReturnType<typeof serializeAgendaActivity>;
