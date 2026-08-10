"use client";

import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addMonths, subMonths, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { getCongesAnnuel } from "@/lib/actions/conge-annuel";
import { CongeAnnuelFormDialog, type CongeItemForEdit } from "@/components/CongeAnnuelFormDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { User, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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

type CongeItem = {
  id: string;
  employeeId: string;
  datedebut: string;
  datefin: string;
  status: string;
  Employee: { id: string; nom: string; prenoms: string };
};

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: CongeItem;
};

const STATUS_STYLES: Record<
  string,
  { bg: string; border: string; text: string; label: string }
> = {
  EN_ATTENTE: {
    bg: "oklch(0.96 0.08 85)",
    border: "oklch(0.75 0.15 75)",
    text: "oklch(0.35 0.08 55)",
    label: "En attente",
  },
  VALIDE: {
    bg: "oklch(0.88 0.12 155)",
    border: "oklch(0.55 0.18 160)",
    text: "oklch(0.22 0.06 165)",
    label: "Validé",
  },
  EN_COURS: {
    bg: "oklch(0.88 0.1 250)",
    border: "oklch(0.55 0.22 260)",
    text: "oklch(0.25 0.1 265)",
    label: "En cours",
  },
  TERMINEE: {
    bg: "oklch(0.9 0.04 120)",
    border: "oklch(0.6 0.08 130)",
    text: "oklch(0.35 0.05 130)",
    label: "Terminée",
  },
  ANNULE: {
    bg: "oklch(0.95 0.04 25)",
    border: "oklch(0.7 0.12 25)",
    text: "oklch(0.45 0.1 25)",
    label: "Annulé",
  },
};

function EventComponent({ event }: { event: CalendarEvent }) {
  const c = event.resource;
  const style = STATUS_STYLES[c.status] ?? STATUS_STYLES.EN_ATTENTE;
  const employeeName = `${c.Employee.nom} ${c.Employee.prenoms}`;
  return (
    <div
      className="text-xs overflow-hidden p-1.5 rounded border-l-[3px] h-full flex flex-col justify-center"
      style={{ borderLeftColor: style.border }}
    >
      <div className="font-semibold truncate flex items-center gap-1">
        <User className="h-3 w-3 shrink-0 opacity-80" />
        {employeeName}
      </div>
      <div className="text-[11px] opacity-90 mt-0.5 font-medium">{style.label}</div>
    </div>
  );
}

function congeToEvent(c: CongeItem): CalendarEvent {
  const start = new Date(c.datedebut);
  start.setHours(0, 0, 0, 0);
  const end = new Date(c.datefin);
  end.setHours(23, 59, 59, 999);
  const employeeName = `${c.Employee.nom} ${c.Employee.prenoms}`;
  const style = STATUS_STYLES[c.status] ?? STATUS_STYLES.EN_ATTENTE;
  return {
    id: c.id,
    title: `${employeeName} (${style.label})`,
    start,
    end,
    resource: c,
  };
}

const CALENDAR_MESSAGES = {
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
  noEventsInRange: "Aucun congé sur cette période.",
};

const calendarProps = {
  startAccessor: "start" as const,
  endAccessor: "end" as const,
  titleAccessor: "title" as const,
  showAllEvents: true,
  culture: "fr-FR" as const,
  messages: CALENDAR_MESSAGES,
  components: { event: EventComponent, toolbar: () => null },
};

export function ProgrammeCongeClient() {
  const [conges, setConges] = useState<CongeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => startOfMonth(new Date()));
  const [selectedConge, setSelectedConge] = useState<CongeItemForEdit | null>(null);

  const loadConges = async () => {
    setLoading(true);
    const res = await getCongesAnnuel();
    if (res.success && res.data) {
      setConges(res.data as CongeItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadConges();
  }, []);

  const events: CalendarEvent[] = conges.map(congeToEvent);
  const month2Date = addMonths(currentDate, 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Programme des congés</h1>
          <p className="text-muted-foreground mt-1">
            Gérez et visualisez les congés annuels de l&apos;équipe
          </p>
        </div>
        <CongeAnnuelFormDialog
          onSuccess={() => {
            setSelectedConge(null);
            loadConges();
          }}
          triggerLabel="Créer Congé"
          editingConge={selectedConge}
          open={!!selectedConge}
          onOpenChange={(open) => !open && setSelectedConge(null)}
          onOpenCreate={() => setSelectedConge(null)}
        />
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        {loading ? (
          <div className="p-8">
            <Skeleton className="h-[550px] w-full rounded-lg" />
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate((d) => subMonths(d, 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>
              <span className="text-sm font-medium capitalize">
                {format(currentDate, "MMMM yyyy", { locale: fr })} — {format(month2Date, "MMMM yyyy", { locale: fr })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate((d) => addMonths(d, 1))}
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="programme-conge-calendar min-w-0">
                <Calendar
                  localizer={localizer}
                  events={events}
                  date={currentDate}
                  onNavigate={() => {}}
                  onSelectEvent={(event: CalendarEvent) =>
                    setSelectedConge({
                      id: event.resource.id,
                      employeeId: event.resource.employeeId,
                      datedebut: event.resource.datedebut,
                      datefin: event.resource.datefin,
                      status: event.resource.status,
                    })
                  }
                  style={{ height: 500 }}
                  eventPropGetter={(event: CalendarEvent) => {
                    const c = event.resource;
                    const style = STATUS_STYLES[c.status] ?? STATUS_STYLES.EN_ATTENTE;
                    return {
                      style: {
                        backgroundColor: style.bg,
                        color: style.text,
                        border: `1px solid ${style.border}`,
                        borderRadius: "6px",
                      },
                    };
                  }}
                  {...calendarProps}
                />
              </div>
              <div className="programme-conge-calendar min-w-0">
                <Calendar
                  localizer={localizer}
                  events={events}
                  date={month2Date}
                  onNavigate={() => {}}
                  onSelectEvent={(event: CalendarEvent) =>
                    setSelectedConge({
                      id: event.resource.id,
                      employeeId: event.resource.employeeId,
                      datedebut: event.resource.datedebut,
                      datefin: event.resource.datefin,
                      status: event.resource.status,
                    })
                  }
                  style={{ height: 500 }}
                  eventPropGetter={(event: CalendarEvent) => {
                    const c = event.resource;
                    const style = STATUS_STYLES[c.status] ?? STATUS_STYLES.EN_ATTENTE;
                    return {
                      style: {
                        backgroundColor: style.bg,
                        color: style.text,
                        border: `1px solid ${style.border}`,
                        borderRadius: "6px",
                      },
                    };
                  }}
                  {...calendarProps}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {Object.entries(STATUS_STYLES).map(([key, { label, border }]) => (
          <div key={key} className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: border }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
