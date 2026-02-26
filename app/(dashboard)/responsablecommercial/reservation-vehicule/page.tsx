"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Car,
  Calendar,
  MapPin,
  Clock,
  RefreshCw,
  Loader2,
  User,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

type ReservationVehicule = {
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

const STATUT_OPTIONS = [
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "CONFIRME", label: "Confirmé" },
  { value: "ANNULE", label: "Annulé" },
  { value: "DEPLACE", label: "Déplacé" },
  { value: "EFFECTUE", label: "Effectué" },
  { value: "EN_COURS", label: "En cours" },
  { value: "TERMINEE", label: "Terminée" },
];

const STATUT_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  EN_ATTENTE: {
    label: "En attente",
    color: "text-amber-700",
    bg: "bg-amber-100/80 border-amber-200/60",
  },
  CONFIRME: {
    label: "Confirmé",
    color: "text-blue-700",
    bg: "bg-blue-100/80 border-blue-200/60",
  },
  ANNULE: {
    label: "Annulé",
    color: "text-red-700",
    bg: "bg-red-100/80 border-red-200/60",
  },
  DEPLACE: {
    label: "Déplacé",
    color: "text-orange-700",
    bg: "bg-orange-100/80 border-orange-200/60",
  },
  EFFECTUE: {
    label: "Effectué",
    color: "text-emerald-700",
    bg: "bg-emerald-100/80 border-emerald-200/60",
  },
  EN_COURS: {
    label: "En cours",
    color: "text-indigo-700",
    bg: "bg-indigo-100/80 border-indigo-200/60",
  },
  TERMINEE: {
    label: "Terminée",
    color: "text-slate-700",
    bg: "bg-slate-100/80 border-slate-200/60",
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

function getUserDisplayName(rv: ReservationVehicule): string {
  if (rv.User) {
    return `${rv.User.firstName} ${rv.User.lastName}`.trim() || rv.User.email;
  }
  return "Utilisateur inconnu";
}

export default function ReservationVehiculePage() {
  const { user, isLoaded } = useUser();
  const [reservations, setReservations] = useState<ReservationVehicule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingReservation, setEditingReservation] =
    useState<ReservationVehicule | null>(null);
  const [editStatut, setEditStatut] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchReservations = useCallback(async () => {
    if (!user?.id) return;
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(
        `${base}/api/reservation-vehicule?userId=${encodeURIComponent(user.id)}&all=true`,
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

  const handleModifierClick = (rv: ReservationVehicule) => {
    setEditingReservation(rv);
    setEditStatut(rv.statut);
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
            clerkUserId: user?.id,
          }),
          credentials: "same-origin",
        }
      );
      const result = await res.json().catch(() => ({}));
      if (result.success) {
        toast.success("Statut modifié avec succès");
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

  const sortedReservations = [...reservations].sort(
    (a, b) =>
      new Date(b.dateReservation).getTime() -
      new Date(a.dateReservation).getTime()
  );

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="h-12 w-12 animate-spin text-amber-600" />
          <p className="text-stone-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <h2 className="text-2xl font-bold text-stone-900 mb-3">
            Non autorisé
          </h2>
          <p className="text-stone-600">
            Vous devez être connecté pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500">
        <div className="relative max-w-7xl mx-auto px-6 py-14">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl shadow-xl border border-white/30">
                <Car className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white drop-shadow-sm tracking-tight">
                  Réservations véhicules
                </h1>
                <p className="text-amber-50/95 text-lg mt-1.5 font-medium">
                  Vue globale — modifier ou supprimer une réservation
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleRefresh}
              disabled={refreshing}
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
          </div>
        ) : reservations.length === 0 ? (
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardContent className="py-16 text-center">
              <Car className="h-16 w-16 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-600 text-lg">
                Aucune réservation de véhicule trouvée.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedReservations.map((rv) => {
              const statutConfig =
                STATUT_CONFIG[rv.statut] || STATUT_CONFIG.EN_ATTENTE;
              const clientName = getClientOrCompanyName(rv);
              const userName = getUserDisplayName(rv);
              const dateLabel = new Date(rv.dateReservation).toLocaleDateString(
                "fr-FR",
                {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }
              );

              return (
                <Card
                  key={rv.id}
                  className="border-0 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-shadow flex flex-col"
                >
                  <CardContent className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-stone-600">
                        <Calendar className="h-4 w-4 text-amber-600" />
                        {dateLabel}
                      </div>
                      <Badge
                        className={`${statutConfig.bg} ${statutConfig.color} border shrink-0`}
                      >
                        {statutConfig.label}
                      </Badge>
                    </div>

                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          {rv.heure_reserve}
                        </span>
                        {rv.moyenTransport && (
                          <span className="text-sm text-stone-600">
                            {rv.moyenTransport}
                          </span>
                        )}
                      </div>
                      {rv.destination && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
                          <span className="text-stone-700">{rv.destination}</span>
                        </div>
                      )}
                      {clientName && (
                        <p className="text-sm font-medium text-stone-800">
                          {clientName}
                        </p>
                      )}
                      {rv.motif && (
                        <p className="text-sm text-stone-600">{rv.motif}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <User className="h-3.5 w-3.5" />
                        {userName}
                      </div>
                      {rv.commentaire && (
                        <p className="text-xs text-stone-500 italic line-clamp-2">
                          {rv.commentaire}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-stone-500 pt-1">
                        <Clock className="h-3.5 w-3.5" />
                        Retour:{" "}
                        {new Date(rv.dateRetour).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleModifierClick(rv)}
                      >
                        <Pencil className="h-4 w-4 mr-1.5" />
                        Modifier
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit statut dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le statut</DialogTitle>
            <DialogDescription>
              Choisissez le nouveau statut pour cette réservation.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={editStatut} onValueChange={setEditStatut}>
              <SelectTrigger>
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={updating}
            >
              Annuler
            </Button>
            <Button onClick={handleEditSubmit} disabled={updating}>
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
