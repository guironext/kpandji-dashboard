"use client";

import React, { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { User, Building2, MapPin } from "lucide-react";

const locales = { "fr-FR": fr };
const parseDate = (dateStr: string, formatStr: string, referenceDate?: Date) =>
  parse(dateStr, formatStr, referenceDate ?? new Date(), { locale: fr });
const localizer = dateFnsLocalizer({
  format,
  parse: parseDate,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export type ReservationVehicule = {
  id: string;
  dateReservation: string;
  dateRetour: string;
  heure_reserve: string;
  destination: string;
  motif: string;
  commentaire: string | null;
  statut: string;
  moyenTransport: string | null;
  clientOuEntrepriseNom: string | null;
  createdAt: string;
  RendezVous?: {
    id: string;
    date: string;
    statut: string;
    resume_rendez_vous: string | null;
    client?: { nom: string };
    Client_entreprise?: { nom_entreprise: string };
  };
};

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: ReservationVehicule;
};

const STATUT_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  EN_ATTENTE: {
    bg: "oklch(0.96 0.08 85)",
    border: "oklch(0.75 0.15 75)",
    text: "oklch(0.35 0.08 55)",
  },
  CONFIRME: {
    bg: "oklch(0.88 0.12 155)",
    border: "oklch(0.55 0.18 160)",
    text: "oklch(0.22 0.06 165)",
  },
  DEPLACE: {
    bg: "oklch(0.88 0.1 250)",
    border: "oklch(0.55 0.22 260)",
    text: "oklch(0.25 0.1 265)",
  },
  EN_COURS: {
    bg: "oklch(0.85 0.12 300)",
    border: "oklch(0.55 0.22 310)",
    text: "oklch(0.28 0.1 315)",
  },
};

function getClientOrCompanyName(rv: ReservationVehicule): string | null {
  return (
    rv.clientOuEntrepriseNom ||
    rv.RendezVous?.client?.nom ||
    rv.RendezVous?.Client_entreprise?.nom_entreprise ||
    null
  );
}

function EventComponent({ event }: { event: CalendarEvent }) {
  const rv = event.resource;
  const clientName = getClientOrCompanyName(rv);
  const style = STATUT_STYLES[rv.statut] ?? STATUT_STYLES.EN_ATTENTE;
  return (
    <div
      className="text-xs overflow-hidden p-1.5 rounded border-l-[3px] h-full flex flex-col justify-center"
      style={{ borderLeftColor: style.border }}
    >
      <div className="font-semibold truncate flex items-center gap-1">
        <MapPin className="h-3 w-3 shrink-0 opacity-80" />
        {rv.destination}
      </div>
      <div className="text-[11px] opacity-90 mt-0.5 font-medium">{rv.heure_reserve}</div>
      {clientName && (
        <div className="flex items-center gap-1 truncate mt-1 opacity-90">
          {rv.RendezVous?.Client_entreprise ? (
            <Building2 className="h-3 w-3 shrink-0" />
          ) : (
            <User className="h-3 w-3 shrink-0" />
          )}
          <span className="truncate">{clientName}</span>
        </div>
      )}
    </div>
  );
}

type ViewName = "month" | "week" | "work_week" | "day" | "agenda";

type Props = {
  events: CalendarEvent[];
};

function useCalendarHeight() {
  const [height, setHeight] = useState(560);

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const reserved = w < 640 ? 200 : w < 1024 ? 240 : 280;
      const target = h - reserved;
      setHeight(Math.max(360, Math.min(820, target)));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  return height;
}

export function CalendrierSortieCalendar({ events }: Props) {
  const calendarHeight = useCalendarHeight();
  const [view, setView] = useState<ViewName>("month");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => {
      if (mq.matches) setView("month");
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <div
      className="relative w-full min-h-[360px] sm:min-h-[480px] calendrier-sortie-wrapper"
      style={{ height: calendarHeight }}
    >
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        style={{ height: "100%" }}
        view={view}
        onView={(next: string) => setView(next as ViewName)}
        showAllEvents
        culture="fr-FR"
        messages={{
          today: "Aujourd'hui",
          previous: "Précédent",
          next: "Suivant",
          month: "Mois",
          week: "Semaine",
          day: "Jour",
          agenda: "Agenda",
          date: "Date",
          time: "Heure",
          event: "Événement",
          noEventsInRange: "Aucune réservation sur cette période.",
        }}
        components={{
          event: EventComponent,
        }}
        eventPropGetter={(event: CalendarEvent) => {
          const rv = event.resource;
          const style = STATUT_STYLES[rv.statut] ?? STATUT_STYLES.EN_ATTENTE;
          return {
            style: {
              backgroundColor: style.bg,
              color: style.text,
              border: `1px solid ${style.border}`,
              borderRadius: "6px",
            },
          };
        }}
      />
    </div>
  );
}
