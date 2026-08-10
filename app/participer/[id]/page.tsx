"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Phone,
  Sparkles,
  User,
  UserPlus,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ActivityLite = {
  id: string;
  titre: string;
  lieu: string | null;
  date: string;
  heureDebut: string;
  heureFin: string;
};

type Registered = {
  id: string;
  nom: string;
  prenom: string;
};

const safeFormatDate = (iso: string) => {
  try {
    return format(new Date(iso), "EEEE d MMMM yyyy", { locale: fr });
  } catch {
    return "";
  }
};

const safeFormatTime = (iso: string) => {
  try {
    return format(new Date(iso), "HH:mm", { locale: fr });
  } catch {
    return "";
  }
};

type PageProps = { params: Promise<{ id: string }> };

const ParticiperPage = ({ params }: PageProps) => {
  const { id } = use(params);

  const [activity, setActivity] = useState<ActivityLite | null>(null);
  const [registered, setRegistered] = useState<Registered[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successName, setSuccessName] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchActivity = useMemo(
    () => async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/public/participants/${id}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Activité introuvable.");
        }
        setActivity(json.data.activity);
        setRegistered(
          (json.data.participants ?? []).map((p: Registered) => ({
            id: p.id,
            nom: p.nom,
            prenom: p.prenom,
          }))
        );
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!nom.trim() || !prenom.trim() || !telephone.trim()) {
      setSubmitError("Nom, prénom et téléphone sont obligatoires.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/participants/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, prenom, telephone, email }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Inscription impossible.");
      }
      setSuccessName(`${json.data.prenom} ${json.data.nom}`.trim());
      setRegistered((prev) => [
        ...prev,
        { id: json.data.id, nom: json.data.nom, prenom: json.data.prenom },
      ]);
      setNom("");
      setPrenom("");
      setTelephone("");
      setEmail("");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Erreur lors de l'inscription."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Chargement de la rencontre…
        </div>
      </div>
    );
  }

  if (loadError || !activity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-rose-100 rounded-2xl shadow-sm p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 flex items-center justify-center mb-4">
            <XCircle className="w-7 h-7 text-rose-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            Rencontre introuvable
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {loadError ??
              "Le QR code scanné ne correspond à aucune rencontre active."}
          </p>
        </div>
      </div>
    );
  }

  if (successName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-emerald-100 rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-5 text-white shadow-lg">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            Inscription confirmée
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Merci <span className="font-semibold">{successName}</span>, votre
            présence à <span className="font-semibold">{activity.titre}</span>{" "}
            a bien été enregistrée.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSuccessName(null);
              }}
            >
              Inscrire une autre personne
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-4 sm:p-8">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Header card */}
        <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 text-xs font-medium bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              Feuille de présence
            </div>
            <h1 className="mt-3 text-xl sm:text-2xl font-bold leading-tight">
              {activity.titre}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-white/90">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" />
                {safeFormatDate(activity.date)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {safeFormatTime(activity.heureDebut)} –{" "}
                {safeFormatTime(activity.heureFin)}
              </span>
              {activity.lieu && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {activity.lieu}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sm:p-6 space-y-4"
        >
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Enregistrer ma présence
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Merci de renseigner vos informations. Elles sont uniquement
              utilisées pour le compte-rendu de la rencontre.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="prenom">Prénom *</Label>
              <Input
                id="prenom"
                autoComplete="given-name"
                placeholder="Prénom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                required
                maxLength={80}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                autoComplete="family-name"
                placeholder="Nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
                maxLength={80}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="telephone">Téléphone *</Label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                id="telephone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+225 07 00 00 00 00"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                required
                className="pl-9"
                maxLength={30}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">
              E-mail <span className="text-gray-400 font-normal">(optionnel)</span>
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={160}
            />
          </div>

          {submitError && (
            <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
              <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full gap-2 bg-gradient-to-r from-indigo-500 to-blue-500 hover:opacity-95 text-white"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            Valider mon inscription
          </Button>
        </form>

        {/* Registered list (read-only, anonymised) */}
        <div className="bg-white/70 backdrop-blur border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-gray-700">
              <User className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-semibold">
                Déjà inscrits ({registered.length})
              </span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {registered.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                Soyez le premier à vous inscrire !
              </p>
            ) : (
              registered.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100"
                >
                  {p.prenom} {p.nom}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticiperPage;
