"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Calendar,
  MapPin,
  Clock,
  RefreshCw,
  Loader2,
  Plus,
  FileText,
  Sparkles,
  Navigation,
  Pencil,
  Trash2,
  Building2,
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
};

function getClientOrCompanyName(rv: ReservationVehicule): string | null {
  return (
    rv.clientOuEntrepriseNom ||
    rv.RendezVous?.client?.nom ||
    rv.RendezVous?.Client_entreprise?.nom_entreprise ||
    null
  );
}

const MOYENS_TRANSPORT = [
  "Djetran",
  "Banco",
  "Taxi Compteur",
  "Yango",
  "Lathaye",
  "Autre",
] as const;

const DISPLAYED_STATUTS = [
  "EN_ATTENTE",
  "CONFIRME",
  "DEPLACE",
  "EN_COURS",
] as const;

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

export default function ReservationVehiculePage() {
  const { user, isLoaded } = useUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingReservation, setEditingReservation] =
    useState<ReservationVehicule | null>(null);
  const [deletingReservation, setDeletingReservation] =
    useState<ReservationVehicule | null>(null);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reservations, setReservations] = useState<ReservationVehicule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({
    dateReservation: "",
    dateRetour: "",
    heure_reserve: "",
    destination: "",
    motif: "",
    commentaire: "",
    moyenTransport: "",
    clientOuEntrepriseNom: "",
  });
  const [editForm, setEditForm] = useState({
    dateReservation: "",
    dateRetour: "",
    heure_reserve: "",
    destination: "",
    motif: "",
    commentaire: "",
    moyenTransport: "",
    clientOuEntrepriseNom: "",
  });

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

  const resetForm = () => {
    const today = new Date().toISOString().split("T")[0];
    const time = new Date().toTimeString().slice(0, 5);
    setForm({
      dateReservation: today,
      dateRetour: today,
      heure_reserve: time,
      destination: "",
      motif: "",
      commentaire: "",
      moyenTransport: "",
      clientOuEntrepriseNom: "",
    });
  };

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (open) resetForm();
  };

  const handleSubmit = async () => {
    const {
      dateReservation,
      dateRetour,
      heure_reserve,
      destination,
      motif,
      commentaire,
      moyenTransport,
      clientOuEntrepriseNom,
    } = form;

    if (
      !moyenTransport ||
      !dateReservation ||
      !dateRetour ||
      !heure_reserve ||
      !destination.trim() ||
      !motif.trim()
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSaving(true);
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${base}/api/reservation-vehicule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inopine: true,
          moyenTransport: moyenTransport.trim(),
          dateReservation: `${dateReservation}T00:00:00`,
          dateRetour: `${dateRetour}T23:59:59`,
          heure_reserve,
          destination: destination.trim(),
          motif: motif.trim(),
          commentaire: commentaire.trim() || undefined,
          clientOuEntrepriseNom: clientOuEntrepriseNom.trim() || undefined,
          clerkUserId: user?.id,
        }),
        credentials: "same-origin",
      });
      const result = await res.json().catch(() => ({}));
      if (result.success) {
        toast.success("Rendez-vous inopiné enregistré avec succès");
        setDialogOpen(false);
        fetchReservations();
      } else {
        toast.error(result.error || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Error saving reservation:", error);
      toast.error("Erreur réseau. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (rv: ReservationVehicule) => {
    const dateRes = new Date(rv.dateReservation);
    const dateRet = new Date(rv.dateRetour);
    setEditingReservation(rv);
    setEditForm({
      dateReservation: dateRes.toISOString().split("T")[0],
      dateRetour: dateRet.toISOString().split("T")[0],
      heure_reserve: rv.heure_reserve,
      destination: rv.destination,
      motif: rv.motif,
      commentaire: rv.commentaire || "",
      moyenTransport: rv.moyenTransport || "",
      clientOuEntrepriseNom: getClientOrCompanyName(rv) || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingReservation) return;
    const {
      dateReservation,
      dateRetour,
      heure_reserve,
      destination,
      motif,
      commentaire,
      moyenTransport,
      clientOuEntrepriseNom,
    } = editForm;
    if (
      !moyenTransport ||
      !dateReservation ||
      !dateRetour ||
      !heure_reserve ||
      !destination.trim() ||
      !motif.trim()
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    setUpdating(true);
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(
        `${base}/api/reservation-vehicule/${editingReservation.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moyenTransport: moyenTransport.trim(),
            dateReservation: `${dateReservation}T00:00:00`,
            dateRetour: `${dateRetour}T23:59:59`,
            heure_reserve,
            destination: destination.trim(),
            motif: motif.trim(),
            commentaire: commentaire.trim() || undefined,
            clientOuEntrepriseNom: clientOuEntrepriseNom.trim() || undefined,
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

  const handleDeleteClick = (rv: ReservationVehicule) => {
    setDeletingReservation(rv);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingReservation) return;
    setDeleting(true);
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(
        `${base}/api/reservation-vehicule/${deletingReservation.id}?clerkUserId=${encodeURIComponent(user?.id || "")}`,
        { method: "DELETE", credentials: "same-origin" }
      );
      const result = await res.json().catch(() => ({}));
      if (result.success) {
        toast.success("Réservation supprimée");
        setDeleteDialogOpen(false);
        setDeletingReservation(null);
        fetchReservations();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting reservation:", error);
      toast.error("Erreur réseau. Réessayez.");
    } finally {
      setDeleting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl animate-pulse" />
            <Loader2 className="h-12 w-12 animate-spin text-amber-600 relative" />
          </div>
          <p className="text-stone-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="p-5 bg-amber-50 rounded-2xl inline-block mb-6 ring-4 ring-amber-100">
            <Car className="h-14 w-14 text-amber-600" />
          </div>
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

  const displayedReservations = reservations.filter((r) =>
    DISPLAYED_STATUTS.includes(r.statut as (typeof DISPLAYED_STATUTS)[number])
  );

  const upcomingCount = displayedReservations.filter(
    (r) => new Date(r.dateRetour) >= new Date()
  ).length;
  const todayCount = displayedReservations.filter((r) => {
    const d = new Date(r.dateReservation);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;
  const enCoursCount = displayedReservations.filter(
    (r) => r.statut === "EN_COURS"
  ).length;

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="absolute inset-0 bg-black/5" />
        <div className="relative max-w-7xl mx-auto px-6 py-14">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl shadow-xl border border-white/30">
                  <Car className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-white drop-shadow-sm tracking-tight">
                    Réservation de véhicule
                  </h1>
                  <p className="text-amber-50/95 text-lg mt-1.5 font-medium">
                    Gestion des réservations pour vos déplacements professionnels
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex gap-3">
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
                <Button
                  size="lg"
                  onClick={() => setDialogOpen(true)}
                  className="bg-white hover:bg-white/95 text-amber-900 border-0 shadow-lg font-semibold flex items-center gap-2 hover:scale-[1.02] transition-transform"
                >
                  <Plus className="h-5 w-5" />
                  Créer un rendez-vous Inopiné
                </Button>
              </div>
              <div className="hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/30">
                <div className="w-2.5 h-2.5 bg-emerald-300 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
                <span className="text-sm font-medium text-white">
                  Système actif
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 -mt-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm overflow-hidden hover:shadow-2xl transition-all duration-300 rounded-2xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100/50 rounded-bl-full" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-700 uppercase tracking-wider">
                    Total
                  </p>
                  <p className="text-3xl font-bold text-stone-900 mt-1">
                    {displayedReservations.length}
                  </p>
                  <p className="text-sm text-stone-500 mt-0.5">Actives</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Car className="h-8 w-8 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm overflow-hidden hover:shadow-2xl transition-all duration-300 rounded-2xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/50 rounded-bl-full" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">
                    À venir
                  </p>
                  <p className="text-3xl font-bold text-stone-900 mt-1">
                    {upcomingCount}
                  </p>
                  <p className="text-sm text-stone-500 mt-0.5">Prochaines</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Clock className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm overflow-hidden hover:shadow-2xl transition-all duration-300 rounded-2xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-100/50 rounded-bl-full" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-rose-700 uppercase tracking-wider">
                    Aujourd&apos;hui
                  </p>
                  <p className="text-3xl font-bold text-stone-900 mt-1">
                    {todayCount}
                  </p>
                  <p className="text-sm text-stone-500 mt-0.5">Du jour</p>
                </div>
                <div className="p-3 bg-rose-100 rounded-xl">
                  <Calendar className="h-8 w-8 text-rose-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm overflow-hidden hover:shadow-2xl transition-all duration-300 rounded-2xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-100/50 rounded-bl-full" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-violet-700 uppercase tracking-wider">
                    En cours
                  </p>
                  <p className="text-3xl font-bold text-stone-900 mt-1">
                    {enCoursCount}
                  </p>
                  <p className="text-sm text-stone-500 mt-0.5">En déplacement</p>
                </div>
                <div className="p-3 bg-violet-100 rounded-xl">
                  <Navigation className="h-8 w-8 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reservations List */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center py-24">
              <Loader2 className="h-12 w-12 animate-spin text-amber-600 mb-4" />
              <p className="text-stone-600 font-medium">
                Chargement des réservations...
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 border-b border-amber-100/50 px-8 py-6">
              <CardTitle className="text-xl font-bold text-stone-900 flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 rounded-xl flex items-center">
                  <Car className="h-6 w-6 text-amber-600 mr-3.5" />
                  Mes réservations
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {displayedReservations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6">
                  <div className="p-6 bg-amber-50 rounded-3xl mb-6">
                    <Car className="h-16 w-16 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-2">
                    Aucune réservation active
                  </h3>
                  <p className="text-stone-500 text-center max-w-sm mb-8">
                    Aucune réservation en attente, confirmée, déplacée ou en cours.
                    Créez un rendez-vous inopiné pour commencer.
                  </p>
                  <Button
                    size="lg"
                    onClick={() => setDialogOpen(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-medium"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Créer une réservation
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {displayedReservations.map((rv) => {
                    const statutInfo =
                      STATUT_CONFIG[rv.statut] || STATUT_CONFIG.EN_ATTENTE;
                    const dateRes = new Date(rv.dateReservation);
                    const dateRet = new Date(rv.dateRetour);
                    const formatDate = (d: Date) =>
                      new Intl.DateTimeFormat("fr-FR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(d);

                    const clientName = getClientOrCompanyName(rv);

                    return (
                      <div
                        key={rv.id}
                        className="group px-8 py-6 hover:bg-amber-50/40 transition-all duration-200 border-l-4 border-l-transparent hover:border-l-amber-400"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-3 p-3 bg-stone-50 rounded-lg border border-stone-100">
                              <Building2 className="h-4 w-4 text-amber-600 shrink-0" />
                              <span className="font-semibold text-stone-900">
                                {clientName || "—"}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                  <Car className="h-4 w-4 text-amber-600" />
                                </div>
                                <span className="font-semibold text-stone-900 text-lg">
                                  {rv.moyenTransport || "—"}
                                </span>
                              </div>
                              <Badge
                                variant="outline"
                                className={`${statutInfo.bg} ${statutInfo.color} font-medium border`}
                              >
                                {statutInfo.label}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-stone-600">
                                <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
                                <span>
                                  {formatDate(dateRes)} → {formatDate(dateRet)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-stone-600">
                                <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                                <span>{rv.heure_reserve}</span>
                              </div>
                              <div className="flex items-center gap-2 text-stone-600">
                                <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
                                <span className="truncate">{rv.destination}</span>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-4">
                              <div className="flex items-center gap-1.5 text-stone-500 text-sm">
                                <FileText className="h-3.5 w-3.5" />
                                <span>{rv.motif}</span>
                              </div>
                            </div>
                            {rv.commentaire && (
                              <p className="mt-2 text-sm text-stone-500 italic pl-5 border-l-2 border-amber-100">
                                {rv.commentaire}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(rv)}
                              className="gap-1.5"
                            >
                              <Pencil className="h-4 w-4" />
                              Modifier
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(rv)}
                              className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <Trash2 className="h-4 w-4" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[520px] rounded-2xl border-stone-200 shadow-2xl">
          <DialogHeader className="space-y-2 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 rounded-xl">
                <Sparkles className="h-6 w-6 text-amber-600" />
              </div>
              <DialogTitle className="text-2xl font-bold text-stone-900">
                Créer un rendez-vous Inopiné
              </DialogTitle>
            </div>
            <DialogDescription className="text-stone-500">
              Remplissez les informations pour enregistrer une réservation de
              véhicule sans rendez-vous préalable.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid gap-2">
              <Label
                htmlFor="clientOuEntrepriseNom"
                className="text-stone-700 font-medium"
              >
                Client / Entreprise (optionnel)
              </Label>
              <Input
                id="clientOuEntrepriseNom"
                placeholder="Nom du client ou de l'entreprise"
                value={form.clientOuEntrepriseNom}
                onChange={(e) =>
                  setForm({ ...form, clientOuEntrepriseNom: e.target.value })
                }
                className="rounded-lg border-stone-200"
              />
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="moyenTransport"
                className="text-stone-700 font-medium"
              >
                Véhicule / Moyen de transport *
              </Label>
              <Select
                value={form.moyenTransport}
                onValueChange={(v) =>
                  setForm({ ...form, moyenTransport: v })
                }
              >
                <SelectTrigger className="rounded-lg border-stone-200">
                  <SelectValue placeholder="Sélectionner un moyen de transport" />
                </SelectTrigger>
                <SelectContent>
                  {MOYENS_TRANSPORT.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="dateReservation"
                  className="text-stone-700 font-medium"
                >
                  Date de réservation *
                </Label>
                <Input
                  id="dateReservation"
                  type="date"
                  value={form.dateReservation}
                  onChange={(e) =>
                    setForm({ ...form, dateReservation: e.target.value })
                  }
                  className="rounded-lg border-stone-200"
                />
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="dateRetour"
                  className="text-stone-700 font-medium"
                >
                  Date de retour *
                </Label>
                <Input
                  id="dateRetour"
                  type="date"
                  value={form.dateRetour}
                  onChange={(e) =>
                    setForm({ ...form, dateRetour: e.target.value })
                  }
                  className="rounded-lg border-stone-200"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="heure_reserve"
                className="text-stone-700 font-medium"
              >
                Heure réservée *
              </Label>
              <Input
                id="heure_reserve"
                type="time"
                value={form.heure_reserve}
                onChange={(e) =>
                  setForm({ ...form, heure_reserve: e.target.value })
                }
                className="rounded-lg border-stone-200"
              />
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="destination"
                className="text-stone-700 font-medium"
              >
                Destination *
              </Label>
              <Input
                id="destination"
                placeholder="Ex: Centre-ville"
                value={form.destination}
                onChange={(e) =>
                  setForm({ ...form, destination: e.target.value })
                }
                className="rounded-lg border-stone-200"
              />
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="motif"
                className="text-stone-700 font-medium"
              >
                Motif *
              </Label>
              <Input
                id="motif"
                placeholder="Ex: Rendez-vous client"
                value={form.motif}
                onChange={(e) =>
                  setForm({ ...form, motif: e.target.value })
                }
                className="rounded-lg border-stone-200"
              />
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="commentaire"
                className="text-stone-700 font-medium"
              >
                Commentaire
              </Label>
              <Textarea
                id="commentaire"
                placeholder="Commentaire optionnel..."
                value={form.commentaire}
                onChange={(e) =>
                  setForm({ ...form, commentaire: e.target.value })
                }
                rows={2}
                className="rounded-lg border-stone-200 resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-4 border-t border-stone-100">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="rounded-lg"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingReservation(null);
        }}
      >
        <DialogContent className="sm:max-w-[520px] rounded-2xl border-stone-200 shadow-2xl">
          <DialogHeader className="space-y-2 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 rounded-xl">
                <Pencil className="h-6 w-6 text-amber-600" />
              </div>
              <DialogTitle className="text-2xl font-bold text-stone-900">
                Modifier la réservation
              </DialogTitle>
            </div>
            <DialogDescription className="text-stone-500">
              Modifiez les informations de la réservation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid gap-2">
              <Label className="text-stone-700 font-medium">
                Client / Entreprise (optionnel)
              </Label>
              <Input
                placeholder="Nom du client ou de l'entreprise"
                value={editForm.clientOuEntrepriseNom}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    clientOuEntrepriseNom: e.target.value,
                  })
                }
                className="rounded-lg border-stone-200"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-stone-700 font-medium">
                Véhicule / Moyen de transport *
              </Label>
              <Select
                value={editForm.moyenTransport}
                onValueChange={(v) =>
                  setEditForm({ ...editForm, moyenTransport: v })
                }
              >
                <SelectTrigger className="rounded-lg border-stone-200">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {MOYENS_TRANSPORT.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-stone-700 font-medium">
                  Date de réservation *
                </Label>
                <Input
                  type="date"
                  value={editForm.dateReservation}
                  onChange={(e) =>
                    setEditForm({ ...editForm, dateReservation: e.target.value })
                  }
                  className="rounded-lg border-stone-200"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-stone-700 font-medium">
                  Date de retour *
                </Label>
                <Input
                  type="date"
                  value={editForm.dateRetour}
                  onChange={(e) =>
                    setEditForm({ ...editForm, dateRetour: e.target.value })
                  }
                  className="rounded-lg border-stone-200"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-stone-700 font-medium">
                Heure réservée *
              </Label>
              <Input
                type="time"
                value={editForm.heure_reserve}
                onChange={(e) =>
                  setEditForm({ ...editForm, heure_reserve: e.target.value })
                }
                className="rounded-lg border-stone-200"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-stone-700 font-medium">Destination *</Label>
              <Input
                placeholder="Ex: Centre-ville"
                value={editForm.destination}
                onChange={(e) =>
                  setEditForm({ ...editForm, destination: e.target.value })
                }
                className="rounded-lg border-stone-200"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-stone-700 font-medium">Motif *</Label>
              <Input
                placeholder="Ex: Rendez-vous client"
                value={editForm.motif}
                onChange={(e) =>
                  setEditForm({ ...editForm, motif: e.target.value })
                }
                className="rounded-lg border-stone-200"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-stone-700 font-medium">Commentaire</Label>
              <Textarea
                placeholder="Commentaire optionnel..."
                value={editForm.commentaire}
                onChange={(e) =>
                  setEditForm({ ...editForm, commentaire: e.target.value })
                }
                rows={2}
                className="rounded-lg border-stone-200 resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-4 border-t border-stone-100">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="rounded-lg"
            >
              Annuler
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={updating}
              className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium"
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeletingReservation(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-stone-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-stone-900">
              Supprimer la réservation
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action
              est irréversible.
              {deletingReservation && (
                <span className="block mt-2 font-medium text-stone-700">
                  {getClientOrCompanyName(deletingReservation) && (
                    <>Client : {getClientOrCompanyName(deletingReservation)} • </>
                  )}
                  {deletingReservation.moyenTransport} -{" "}
                  {deletingReservation.destination}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-lg"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="rounded-lg"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
