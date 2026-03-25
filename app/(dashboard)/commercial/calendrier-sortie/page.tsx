"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, RefreshCw, CalendarDays, Car } from "lucide-react";
import { toast } from "sonner";
import type {
  ReservationVehicule,
  CalendarEvent,
} from "./CalendrierSortieCalendar";

const CalendrierSortieCalendar = dynamic(
  () =>
    import("./CalendrierSortieCalendar").then((mod) => mod.CalendrierSortieCalendar),
  { ssr: false, loading: () => <div className="h-full min-h-[400px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> }
);

const CALENDAR_STATUTS = ["EN_ATTENTE", "CONFIRME", "DEPLACE", "EN_COURS"] as const;

function getClientOrCompanyName(rv: ReservationVehicule): string | null {
  return (
    rv.clientOuEntrepriseNom ||
    rv.RendezVous?.client?.nom ||
    rv.RendezVous?.Client_entreprise?.nom_entreprise ||
    null
  );
}

function reservationToEvent(rv: ReservationVehicule): CalendarEvent {
  const [hourPart, minPart] = (rv.heure_reserve || "09:00").trim().split(":");
  const startDate = new Date(rv.dateReservation);
  startDate.setHours(
    parseInt(hourPart || "9", 10),
    parseInt(minPart || "0", 10),
    0,
    0
  );
  const endDate = new Date(rv.dateRetour);
  if (endDate <= startDate) {
    endDate.setTime(startDate.getTime() + 60 * 60 * 1000);
  }
  const clientName = getClientOrCompanyName(rv);
  const title = [
    rv.destination,
    clientName ? `— ${clientName}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return {
    id: rv.id,
    title,
    start: startDate,
    end: endDate,
    resource: rv,
  };
}

function countTodayEvents(events: CalendarEvent[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return events.filter((e) => {
    const d = new Date(e.start);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }).length;
}

export default function CalendrierSortiePage() {
  const { user, isLoaded } = useUser();
  const [reservations, setReservations] = useState<ReservationVehicule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReservations = useCallback(async () => {
    if (!user?.id) return;
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(
        `${base}/api/reservation-vehicule?userId=${encodeURIComponent(user.id)}`,
        { credentials: "same-origin" }
      );
      const result = await res.json().catch(() => ({}));
      if (result.success) {
        setReservations((result.data || []) as ReservationVehicule[]);
      } else {
        toast.error(result.error || "Erreur lors du chargement");
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast.error("Erreur lors du chargement des réservations");
    }
  }, [user?.id]);

  useEffect(() => {
    if (isLoaded) {
      if (user?.id) {
        fetchReservations().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, [isLoaded, user?.id, fetchReservations]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReservations();
    setRefreshing(false);
  };

  const filteredReservations = reservations.filter((r) =>
    CALENDAR_STATUTS.includes(r.statut as (typeof CALENDAR_STATUTS)[number])
  );
  const events: CalendarEvent[] = filteredReservations.map(reservationToEvent);
  const todayCount = countTodayEvents(events);

  const prevEventsDigestRef = useRef<string | null>(null);

  useEffect(() => {
    const digest = events.map((e) => `${e.id}:${e.resource.statut}`).join("|");
    if (prevEventsDigestRef.current === null) {
      prevEventsDigestRef.current = digest;
      return;
    }
    if (prevEventsDigestRef.current !== digest) {
      prevEventsDigestRef.current = digest;
      toast.info("Calendrier mis à jour", {
        position: "top-center",
        description: `${events.length} réservation${events.length !== 1 ? "s" : ""} affichée${events.length !== 1 ? "s" : ""}`,
      });
    }
  }, [events]);

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-3 sm:p-4 md:p-6 gap-3 sm:gap-4 pb-6 sm:pb-8">
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden shadow-sm border-border/80">
        <CardHeader className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <div className="flex items-start sm:items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
                    Calendrier des sorties
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-snug">
                    Réservations véhicule — en attente, confirmées, déplacées, en cours
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {events.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20">
                    <Car className="h-3.5 w-3.5 mr-1" />
                    {events.length} réservation{events.length > 1 ? "s" : ""}
                  </Badge>
                  {todayCount > 0 && (
                    <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                      {todayCount} aujourd&apos;hui
                    </Badge>
                  )}
                </div>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                className="shrink-0"
                title="Actualiser"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="flex-1 min-h-0 max-h-[calc(100dvh-8.5rem)] sm:max-h-[calc(100vh-14rem)] rounded-xl border-2 border-border bg-card overflow-y-auto overflow-x-auto pb-4 sm:pb-8 [-webkit-overflow-scrolling:touch] overscroll-contain custom-scrollbar">
            <CalendrierSortieCalendar events={events} />
          </div>
        </CardContent>
      </Card>

      {events.length === 0 && !loading && (
        <Card className="flex-shrink-0 border-dashed">
          <CardContent className="py-12 px-6">
            <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="p-4 rounded-full bg-muted/80 mb-4">
                <MapPin className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg text-foreground">
                Aucune réservation à afficher
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Seules les réservations en attente, confirmées, déplacées ou en cours sont affichées dans le calendrier.
              </p>
              <p className="text-xs text-muted-foreground/80 mt-1">
                Créez une réservation véhicule pour la voir apparaître ici.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
