"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  MapPin,
  RefreshCw,
  Users,
  CalendarDays,
  Car,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import type {
  ReservationVehicule,
  CalendarEvent,
} from "./CalendrierSortieCalendar";

const STATUT_OPTIONS = [
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "CONFIRME", label: "Confirmé" },
  { value: "ANNULE", label: "Annulé" },
  { value: "DEPLACE", label: "Déplacé" },
  { value: "EFFECTUE", label: "Effectué" },
  { value: "EN_COURS", label: "En cours" },
  { value: "TERMINEE", label: "Terminée" },
];

const CalendrierSortieCalendar = dynamic(
  () =>
    import("./CalendrierSortieCalendar").then(
      (mod) => mod.CalendrierSortieCalendar
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[700px] flex items-center justify-center rounded-2xl bg-muted/30">
        <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
      </div>
    ),
  }
);

const CALENDAR_STATUTS_DEFAULT = [
  "EN_ATTENTE",
  "CONFIRME",
  "DEPLACE",
  "EN_COURS",
] as const;

const STATUT_BADGES = [
  { value: "EN_ATTENTE", label: "En attente", className: "bg-amber-100 text-amber-800" },
  { value: "CONFIRME", label: "Confirmé", className: "bg-blue-100 text-blue-800" },
  { value: "DEPLACE", label: "Déplacé", className: "bg-orange-100 text-orange-800" },
  { value: "EN_COURS", label: "En cours", className: "bg-indigo-100 text-indigo-800" },
] as const;

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
  const userName = rv.User
    ? [rv.User.firstName, rv.User.lastName].filter(Boolean).join(" ") ||
      rv.User.email ||
      ""
    : "";
  const title = [
    rv.destination,
    userName ? `— ${userName}` : "",
    clientName ? `(${clientName})` : "",
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
  const [userFilter, setUserFilter] = useState<string>("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingReservation, setEditingReservation] =
    useState<ReservationVehicule | null>(null);
  const [editStatut, setEditStatut] = useState("");
  const [editAccompagnant, setEditAccompagnant] = useState("");
  const [editCoutTransport, setEditCoutTransport] = useState("");
  const [updating, setUpdating] = useState(false);
  const [calendarStatuts, setCalendarStatuts] = useState<string[]>(
    [...CALENDAR_STATUTS_DEFAULT]
  );
  const isInitialMount = React.useRef(true);

  const toggleStatut = useCallback((statut: string) => {
    setCalendarStatuts((prev) =>
      prev.includes(statut)
        ? prev.filter((s) => s !== statut)
        : [...prev, statut]
    );
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const count = calendarStatuts.length;
    const labels = STATUT_BADGES.filter((b) => calendarStatuts.includes(b.value))
      .map((b) => b.label)
      .join(", ");
    toast.info(
      count > 0
        ? `Filtre mis à jour : ${labels}`
        : "Aucun statut sélectionné — toutes les réservations sont masquées",
      { position: "top-center" }
    );
  }, [calendarStatuts]);

  const fetchReservations = useCallback(async () => {
    if (!user?.id) return;
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(
        `${base}/api/reservation-vehicule?all=true`,
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

  const handleSelectEvent = (event: CalendarEvent) => {
    const rv = event.resource;
    setEditingReservation(rv);
    setEditStatut(rv.statut);
    setEditAccompagnant(rv.accompagnant ?? "");
    setEditCoutTransport(rv.coutTransport != null ? String(rv.coutTransport) : "");
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingReservation) return;
    setUpdating(true);
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(
        `${base}/api/reservation-vehicule/${editingReservation.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            statut: editStatut,
            accompagnant: editAccompagnant.trim() || null,
            coutTransport: editCoutTransport ? parseFloat(editCoutTransport) : 0,
            clerkUserId: user?.id,
          }),
          credentials: "same-origin",
        }
      );
      const result = await res.json().catch(() => ({}));
      if (result.success) {
        toast.success("Réservation modifiée avec succès");
        setEditDialogOpen(false);
        setEditingReservation(null);
        fetchReservations();
      } else {
        toast.error(result.error || "Erreur lors de la modification");
      }
    } catch (error) {
      console.error("Error updating reservation:", error);
      toast.error("Erreur réseau. Réessayez.");
    } finally {
      setUpdating(false);
    }
  };

  const filteredByStatut = reservations.filter((r) =>
    calendarStatuts.includes(r.statut)
  );

  const uniqueUsers = Array.from(
    new Map(
      filteredByStatut
        .filter((r) => r.User)
        .map((r) => [
          r.User!.id,
          {
            id: r.User!.id,
            name:
              [r.User!.firstName, r.User!.lastName].filter(Boolean).join(" ") ||
              r.User!.email ||
              "Sans nom",
          },
        ])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const filteredReservations =
    userFilter === "all"
      ? filteredByStatut
      : filteredByStatut.filter((r) => r.User?.id === userFilter);

  const events: CalendarEvent[] =
    filteredReservations.map(reservationToEvent);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="h-12 w-12 animate-spin text-amber-600" />
          <p className="text-stone-600 font-medium">Chargement du calendrier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Hero header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500">
        <div className="absolute inset-0 bg-white/10" />
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl shadow-xl border border-white/30">
                <CalendarDays className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white drop-shadow-sm tracking-tight">
                  Calendrier des sorties
                </h1>
                <p className="text-amber-50/95 text-lg mt-1.5 font-medium">
                  Vue globale — Tous les commerciaux
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-xl px-4 py-2.5 border border-white/30">
                <Filter className="h-5 w-5 text-white" />
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-[200px] border-0 bg-white/90 hover:bg-white text-stone-800 font-medium h-9">
                    <Users className="h-4 w-4 mr-2 text-amber-600" />
                    <SelectValue placeholder="Filtrer par commercial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les commerciaux</SelectItem>
                    {uniqueUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                size="lg"
                className="bg-white/90 hover:bg-white text-amber-900 border-0 shadow-lg font-medium"
              >
                <RefreshCw
                  className={`h-5 w-5 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Actualiser
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="px-6 py-5 border-b bg-gradient-to-r from-stone-50 to-amber-50/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                    <Car className="h-5 w-5 text-amber-600" />
                    Réservations véhicule
                  </h2>
                  <p className="text-sm text-stone-600 mt-0.5">
                    Cliquez sur une réservation pour modifier son statut. Affichage : en attente, confirmées, déplacées, en cours.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-stone-500 font-medium">Statuts (cliquez pour filtrer) :</span>
                  {STATUT_BADGES.map((badge) => {
                    const isActive = calendarStatuts.includes(badge.value);
                    return (
                      <button
                        key={badge.value}
                        type="button"
                        onClick={() => toggleStatut(badge.value)}
                        className={`px-2 py-0.5 rounded-full transition-all cursor-pointer border ${
                          isActive
                            ? `${badge.className} border-transparent`
                            : "bg-stone-100 text-stone-400 border-stone-200 hover:bg-stone-200 hover:text-stone-500"
                        }`}
                      >
                        {badge.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-6">
              {events.length > 0 ? (
                <div className="rounded-xl border border-stone-200/80 bg-white overflow-hidden shadow-inner">
                  <CalendrierSortieCalendar
                    events={events}
                    onSelectEvent={handleSelectEvent}
                  />
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-stone-200 bg-stone-50/50 py-20 text-center">
                  <MapPin className="h-16 w-16 text-stone-300 mx-auto mb-4" />
                  <p className="text-stone-600 text-lg font-medium">
                    Aucune réservation à afficher
                  </p>
                  <p className="text-stone-500 text-sm mt-2 max-w-md mx-auto">
                    {userFilter !== "all"
                      ? "Aucune réservation pour ce commercial sur cette période."
                      : "Seules les réservations en attente, confirmées, déplacées ou en cours sont affichées."}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Modifier la réservation</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-1 pt-1">
                {editingReservation && (
                  <>
                    <p className="font-medium text-stone-800">
                      {editingReservation.destination}
                    </p>
                    <p className="text-sm text-stone-600">
                      {editingReservation.heure_reserve}
                      {editingReservation.User &&
                        ` • ${[editingReservation.User.firstName, editingReservation.User.lastName]
                          .filter(Boolean)
                          .join(" ") || editingReservation.User.email}`}
                    </p>
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Statut</label>
              <Select value={editStatut} onValueChange={setEditStatut}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {STATUT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Accompagnateur</label>
              <Input
                value={editAccompagnant}
                onChange={(e) => setEditAccompagnant(e.target.value)}
                placeholder="Nom de l'accompagnateur"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Coût du transport</label>
              <Input
                type="number"
                value={editCoutTransport}
                onChange={(e) => setEditCoutTransport(e.target.value)}
                placeholder="0"
                min={0}
                step="0.01"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={updating}
              className="rounded-xl"
            >
              Annuler
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={updating}
              className="rounded-xl bg-amber-600 hover:bg-amber-700"
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
