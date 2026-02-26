"use client";

import React from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { User, Building2 } from "lucide-react";

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
  return (
    <div className="text-xs overflow-hidden p-0.5">
      <div className="font-medium truncate">{rv.destination}</div>
      <div className="text-muted-foreground truncate">{rv.heure_reserve}</div>
      {clientName && (
        <div className="flex items-center gap-1 truncate text-muted-foreground mt-0.5">
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

type Props = {
  events: CalendarEvent[];
};

export function CalendrierSortieCalendar({ events }: Props) {
  return (
    <div className="h-[600px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        style={{ height: "100%" }}
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
        eventPropGetter={() => ({
          style: {
            backgroundColor: "hsl(var(--primary))",
            color: "hsl(var(--primary-foreground))",
            border: "none",
            borderRadius: "4px",
          },
        })}
      />
    </div>
  );
}
