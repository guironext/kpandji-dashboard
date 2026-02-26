"use client";

import React from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { User, Building2, UserCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  CONFIRME: "Confirmé",
  ANNULE: "Annulé",
  DEPLACE: "Déplacé",
  EFFECTUE: "Effectué",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
};

const STATUT_COLORS: Record<string, { bg: string; color: string; eventBg: string; eventBorder: string }> = {
  EN_ATTENTE: { bg: "bg-amber-100/90", color: "text-amber-800", eventBg: "#fef3c7", eventBorder: "#f59e0b" },
  CONFIRME: { bg: "bg-blue-100/90", color: "text-blue-800", eventBg: "#dbeafe", eventBorder: "#2563eb" },
  ANNULE: { bg: "bg-red-100/90", color: "text-red-800", eventBg: "#fee2e2", eventBorder: "#dc2626" },
  DEPLACE: { bg: "bg-orange-100/90", color: "text-orange-800", eventBg: "#ffedd5", eventBorder: "#ea580c" },
  EFFECTUE: { bg: "bg-emerald-100/90", color: "text-emerald-800", eventBg: "#d1fae5", eventBorder: "#059669" },
  EN_COURS: { bg: "bg-indigo-100/90", color: "text-indigo-800", eventBg: "#e0e7ff", eventBorder: "#4f46e5" },
  TERMINEE: { bg: "bg-slate-100/90", color: "text-slate-800", eventBg: "#f1f5f9", eventBorder: "#64748b" },
};

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
  User?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
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

function getUserDisplayName(rv: ReservationVehicule): string | null {
  if (!rv.User) return null;
  const { firstName, lastName } = rv.User;
  return [firstName, lastName].filter(Boolean).join(" ") || rv.User.email || null;
}

function EventComponent({ event }: { event: CalendarEvent }) {
  const rv = event.resource;
  const clientName = getClientOrCompanyName(rv);
  const userName = getUserDisplayName(rv);
  const statutLabel = STATUT_LABELS[rv.statut] || rv.statut;
  const statutStyle = STATUT_COLORS[rv.statut] || STATUT_COLORS.EN_ATTENTE;
  return (
    <div className="text-xs overflow-hidden p-2 cursor-pointer text-stone-800">
      <div className="flex items-center gap-1 flex-wrap">
        <Badge
          variant="secondary"
          className={`text-[10px] px-1.5 py-0.5 ${statutStyle.bg} ${statutStyle.color} border-0 font-medium`}
        >
          {statutLabel}
        </Badge>
      </div>
      <div className="font-semibold truncate mt-1 text-stone-900">{rv.destination}</div>
      <div className="text-stone-600 truncate">{rv.heure_reserve}</div>
      {userName && (
        <div className="flex items-center gap-1 truncate text-stone-600 mt-0.5">
          <UserCircle className="h-3 w-3 shrink-0" />
          <span className="truncate font-medium">{userName}</span>
        </div>
      )}
      {clientName && (
        <div className="flex items-center gap-1 truncate text-stone-600 mt-0.5">
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
  onSelectEvent?: (event: CalendarEvent) => void;
};

export function CalendrierSortieCalendar({ events, onSelectEvent }: Props) {
  return (
    <div className="h-[800px]">
      <Calendar
        localizer={localizer}
        events={events}
        onSelectEvent={onSelectEvent}
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
        eventPropGetter={(event) => {
          const rv = (event as CalendarEvent).resource;
          const style = STATUT_COLORS[rv.statut] || STATUT_COLORS.EN_ATTENTE;
          return {
            style: {
              backgroundColor: style.eventBg,
              color: "#1e293b",
              border: `1px solid ${style.eventBorder}`,
              borderRadius: "8px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            },
          };
        }}
      />
    </div>
  );
}
