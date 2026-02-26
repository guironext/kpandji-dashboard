"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type {
  ReservationVehicule,
  CalendarEvent,
} from "./CalendrierSortieCalendar";

const CalendrierSortieCalendar = dynamic(
  () =>
    import("./CalendrierSortieCalendar").then((mod) => mod.CalendrierSortieCalendar),
  { ssr: false, loading: () => <div className="h-[600px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> }
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

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xl">Calendrier des sorties</CardTitle>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
            title="Actualiser"
          >
            <RefreshCw
              className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Réservations véhicule (en attente, confirmées, déplacées, en cours)
          </p>
          <div className="rounded-lg border bg-card overflow-hidden">
            <CalendrierSortieCalendar events={events} />
          </div>
        </CardContent>
      </Card>

      {events.length === 0 && !loading && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Aucune réservation à afficher.</p>
            <p className="text-sm mt-1">
              Seules les réservations en attente, confirmées, déplacées ou en
              cours sont affichées.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
