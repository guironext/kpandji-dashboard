"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Car,
  User,
  Users,
  Hash,
  ClipboardList,
  Send,
  CheckCircle2,
  ArrowRight,
  Phone,
  Search,
  Sparkles,
  Wrench,
  RefreshCw,
  Palette,
  ChevronRight,
  BadgePercent,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DetailDiagnostic {
  id: string;
  nom: string;
  reparationId?: string | null;
}

interface DiagnosticArrivee {
  id: string;
  catergorieDiagnostic?: { id: string; nom: string } | null;
  DetailDiagnostic: DetailDiagnostic[];
}

interface VoitureDispatch {
  id: string;
  model: string;
  immatriculation: string;
  couleur: string;
  statut: string;
  ClientSAV?: { nom?: string; prenom?: string; contact?: string };
  diagnosticArrivee: DiagnosticArrivee[];
}

interface GroupePersonnel {
  id: string;
  nom: string;
  chefGroupe?: { nom?: string; prenom?: string } | null;
  _count?: { personnelSAVs: number };
}

const COLOR_HEX: Record<string, string> = {
  blanc: "#f8fafc",
  blanche: "#f8fafc",
  noir: "#0f172a",
  noire: "#0f172a",
  gris: "#94a3b8",
  grise: "#94a3b8",
  argent: "#cbd5e1",
  rouge: "#dc2626",
  bleu: "#2563eb",
  bleue: "#2563eb",
  vert: "#16a34a",
  verte: "#16a34a",
  jaune: "#eab308",
  orange: "#ea580c",
  beige: "#d6c3a8",
  marron: "#7c2d12",
  bordeaux: "#9f1239",
};

function colorHex(couleur: string) {
  return COLOR_HEX[couleur.trim().toLowerCase()] ?? "#64748b";
}

function clientLabel(v: VoitureDispatch) {
  return (
    [v.ClientSAV?.nom, v.ClientSAV?.prenom].filter(Boolean).join(" ") ||
    "Client non renseigné"
  );
}

function detailCount(v: VoitureDispatch) {
  return v.diagnosticArrivee.reduce(
    (n, da) => n + (da.DetailDiagnostic?.length || 0),
    0,
  );
}

function chefLabel(g: GroupePersonnel) {
  const name = [g.chefGroupe?.prenom, g.chefGroupe?.nom]
    .filter(Boolean)
    .join(" ");
  return name || null;
}

type DispatchMode = "garantie" | "normal";

function LicensePlate({ immat }: { immat: string }) {
  return (
    <span className="inline-flex max-w-full items-stretch overflow-hidden rounded-lg border border-slate-800/80 bg-slate-950 shadow-sm">
      <span className="flex w-5 shrink-0 flex-col items-center justify-center bg-indigo-600 text-[8px] font-black leading-none text-white">
        SAV
      </span>
      <span className="truncate px-2 py-1 font-mono text-[11px] font-bold tracking-wider text-amber-400 sm:text-xs">
        <Hash className="mr-0.5 inline h-3 w-3 opacity-70" />
        {immat}
      </span>
    </span>
  );
}

function DispatchModeButtons({
  disabled,
  busy,
  busyMode,
  onDispatch,
}: {
  disabled: boolean;
  busy: boolean;
  busyMode: DispatchMode | null;
  onDispatch: (mode: DispatchMode) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
      <Button
        type="button"
        disabled={disabled}
        onClick={() => onDispatch("garantie")}
        className={cn(
          "h-12 flex-col gap-0 rounded-xl px-2 text-white shadow-md shadow-rose-600/20 sm:h-[3.35rem]",
          "bg-gradient-to-br from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700",
        )}
      >
        <span className="flex items-center text-sm font-bold">
          {busy && busyMode === "garantie" ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <BadgePercent className="mr-1.5 h-4 w-4" />
          )}
          Garantie
        </span>
        <span className="hidden text-[10px] font-medium opacity-80 sm:inline">
          Garantie SAV en cours
        </span>
      </Button>
      <Button
        type="button"
        disabled={disabled}
        onClick={() => onDispatch("normal")}
        className={cn(
          "h-12 flex-col gap-0 rounded-xl px-2 text-white shadow-md shadow-indigo-600/20 sm:h-[3.35rem]",
          "bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700",
        )}
      >
        <span className="flex items-center text-sm font-bold">
          {busy && busyMode === "normal" ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Wrench className="mr-1.5 h-4 w-4" />
          )}
          Normal
        </span>
        <span className="hidden text-[10px] font-medium opacity-80 sm:inline">
          En traitement
        </span>
      </Button>
    </div>
  );
}

export default function DispatchingClient() {
  const [voitures, setVoitures] = useState<VoitureDispatch[]>([]);
  const [groupes, setGroupes] = useState<GroupePersonnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<Record<string, string>>(
    {},
  );
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [dispatchingMode, setDispatchingMode] = useState<DispatchMode | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/sav/dispatching");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Erreur chargement");
      }
      setVoitures(json.data?.voitures || []);
      setGroupes(json.data?.groupes || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur chargement");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return voitures;
    return voitures.filter((v) => {
      const client = clientLabel(v).toLowerCase();
      return (
        client.includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.immatriculation.toLowerCase().includes(q) ||
        v.couleur.toLowerCase().includes(q)
      );
    });
  }, [voitures, query]);

  const handleDispatch = async (voitureId: string, mode: DispatchMode) => {
    const groupeId = selectedGroups[voitureId];
    if (!groupeId) {
      toast.error("Sélectionnez un groupe d'équipe");
      return;
    }
    setDispatchingId(voitureId);
    setDispatchingMode(mode);
    try {
      const res = await fetch("/api/sav/dispatching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voitureSAVId: voitureId,
          groupePersonnelSAVId: groupeId,
          mode,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Erreur dispatching");
      }
      const team = json.data?.groupe || "l'équipe";
      toast.success(
        mode === "garantie"
          ? `Véhicule envoyé en garantie vers « ${team} »`
          : `Véhicule envoyé en traitement vers « ${team} »`,
      );
      setVoitures((prev) => prev.filter((v) => v.id !== voitureId));
      setSelectedGroups((prev) => {
        const next = { ...prev };
        delete next[voitureId];
        return next;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur dispatching");
    } finally {
      setDispatchingId(null);
      setDispatchingMode(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[min(60vh,420px)] flex-col items-center justify-center gap-5 px-4 py-16 text-center">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse rounded-2xl bg-indigo-500/20 blur-xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-slate-800">
            Chargement du dispatching
          </p>
          <p className="text-xs text-slate-500">
            Véhicules prêts à être affectés…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-6 lg:px-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white shadow-[0_20px_50px_-18px_rgba(67,56,202,0.5)] sm:rounded-3xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-indigo-400/30 blur-3xl sm:h-64 sm:w-64"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-amber-400/20 blur-3xl"
          aria-hidden
        />

        <div className="relative px-4 py-5 sm:px-8 sm:py-8 lg:px-10">
          <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 space-y-2.5 sm:space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-100 backdrop-blur-sm sm:px-3 sm:py-1 sm:text-[11px]">
                <Sparkles className="h-3 w-3 text-amber-300 sm:h-3.5 sm:w-3.5" />
                Affectation atelier
              </div>
              <div className="space-y-1 sm:space-y-2">
                <h1 className="text-xl font-extrabold tracking-tight sm:text-3xl lg:text-[2.25rem] lg:leading-tight">
                  Dispatching SAV
                </h1>
                <p className="max-w-xl text-xs leading-relaxed text-slate-300 sm:text-sm">
                  Choisissez l&apos;équipe, puis envoyez le véhicule en{" "}
                  <span className="font-semibold text-white">Garantie</span> ou
                  en parcours{" "}
                  <span className="font-semibold text-white">Normal</span>.
                </p>
              </div>
              <ol className="hidden flex-wrap items-center gap-1.5 pt-0.5 text-[11px] font-semibold sm:flex sm:gap-2 sm:text-xs">
                <li className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-slate-300 ring-1 ring-white/10">
                  <ClipboardList className="h-3 w-3 text-amber-300" />
                  Diagnostic
                </li>
                <ChevronRight className="h-3.5 w-3.5 text-white/40" />
                <li className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/30 px-2.5 py-1 text-white ring-1 ring-indigo-300/40">
                  <Send className="h-3 w-3 text-indigo-200" />
                  Dispatch
                </li>
                <ChevronRight className="h-3.5 w-3.5 text-white/40" />
                <li className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-slate-300 ring-1 ring-white/10">
                  <Wrench className="h-3 w-3 text-emerald-300" />
                  Atelier
                </li>
              </ol>
            </div>

            <div className="flex items-stretch gap-2">
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 backdrop-blur-md sm:min-w-[9rem] sm:flex-none sm:flex-col sm:items-start sm:justify-center sm:px-4 sm:py-3">
                <span className="text-[10px] font-medium uppercase tracking-wide text-indigo-100/80">
                  En attente
                </span>
                <span className="font-mono text-xl font-semibold tabular-nums sm:text-2xl">
                  {voitures.length}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 backdrop-blur-md sm:min-w-[9rem] sm:flex-none sm:flex-col sm:items-start sm:justify-center sm:px-4 sm:py-3">
                <span className="text-[10px] font-medium uppercase tracking-wide text-indigo-100/80">
                  Équipes
                </span>
                <span className="font-mono text-xl font-semibold tabular-nums sm:text-2xl">
                  {groupes.length}
                </span>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-auto w-11 shrink-0 border border-white/20 bg-white/15 text-white hover:bg-white/25 hover:text-white sm:w-auto sm:min-w-[7.5rem] sm:px-4"
                disabled={refreshing}
                onClick={() => void load(true)}
                aria-label="Actualiser"
              >
                <RefreshCw
                  className={cn("h-4 w-4 sm:mr-2", refreshing && "animate-spin")}
                />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {groupes.length === 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-950 sm:flex-row sm:items-center">
          <p className="flex-1">
            Aucun groupe personnel. Créez-en un avant de dispatcher.
          </p>
          <Button
            asChild
            size="sm"
            className="h-10 shrink-0 rounded-xl bg-amber-600 font-semibold hover:bg-amber-700"
          >
            <Link href="/sav/personnel-sav">Gérer les équipes</Link>
          </Button>
        </div>
      )}

      {voitures.length === 0 ? (
        <Card className="overflow-hidden rounded-2xl border-dashed border-slate-200 shadow-sm sm:rounded-3xl">
          <CardContent className="flex flex-col items-center px-4 py-14 text-center sm:py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/15">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-800">
              File d&apos;attente vide
            </h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              Les véhicules apparaissent ici après l&apos;enregistrement du
              diagnostic d&apos;arrivée (statut Diagnostic fini).
            </p>
            <div className="mt-6 flex w-full max-w-sm flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                asChild
                className="h-11 rounded-xl bg-amber-600 font-semibold hover:bg-amber-700"
              >
                <Link href="/sav/diagnostique-arrivee">Aller au diagnostic</Link>
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-xl"
                onClick={() => void load()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="sticky top-0 z-20 -mx-3 flex flex-col gap-2 bg-slate-50/90 px-3 py-2 backdrop-blur-md sm:static sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                File d&apos;attente
              </p>
              <Badge variant="secondary" className="tabular-nums">
                {filtered.length}
              </Badge>
              <Link
                href="/sav/personnel-sav"
                className="ml-auto text-xs font-semibold text-indigo-700 hover:underline sm:hidden"
              >
                Équipes
              </Link>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto sm:max-w-xs sm:flex-1">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Client, immat, modèle…"
                  className="h-11 rounded-xl border-slate-200 bg-white pl-9 text-sm"
                />
              </div>
              <Link
                href="/sav/personnel-sav"
                className="hidden shrink-0 text-xs font-semibold text-indigo-700 hover:underline sm:inline"
              >
                Gérer les équipes
              </Link>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
              Aucun véhicule ne correspond à la recherche.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
              {filtered.map((v) => {
                const client = clientLabel(v);
                const lines = detailCount(v);
                const groupeId = selectedGroups[v.id] || "";
                const busy = dispatchingId === v.id;
                const expanded = expandedId === v.id;
                const previewDetails = v.diagnosticArrivee.flatMap((da) =>
                  (da.DetailDiagnostic || []).map((d) => ({
                    id: d.id,
                    nom: d.nom,
                    cat: da.catergorieDiagnostic?.nom || "Catégorie",
                  })),
                );
                const shown = expanded
                  ? previewDetails
                  : previewDetails.slice(0, 3);

                return (
                  <Card
                    key={v.id}
                    className="flex flex-col overflow-hidden rounded-2xl border-slate-200/80 shadow-sm ring-1 ring-black/[0.02] sm:rounded-3xl"
                  >
                    <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/50 p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25 sm:h-12 sm:w-12">
                          <Car className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="min-w-0 truncate text-base font-bold text-slate-900 sm:text-lg">
                              {v.model}
                            </h2>
                            <Badge className="rounded-md bg-emerald-50 text-[10px] text-emerald-800 hover:bg-emerald-50 sm:text-xs">
                              Diagnostic fini
                            </Badge>
                          </div>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600 sm:text-sm">
                            <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate font-medium">{client}</span>
                          </p>
                          {v.ClientSAV?.contact && (
                            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                              <Phone className="h-3 w-3 shrink-0" />
                              {v.ClientSAV.contact}
                            </p>
                          )}
                        </div>
                        <LicensePlate immat={v.immatriculation} />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Badge variant="secondary" className="rounded-lg text-[11px]">
                          <ClipboardList className="mr-1 h-3 w-3" />
                          {lines} ligne{lines > 1 ? "s" : ""}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="rounded-lg text-[11px] capitalize"
                        >
                          <span
                            className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
                            style={{ backgroundColor: colorHex(v.couleur) }}
                          />
                          <Palette className="mr-1 h-3 w-3" />
                          {v.couleur}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
                      <div>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Travaux à dispatcher
                        </p>
                        <ul className="space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                          {shown.map((d) => (
                            <li
                              key={d.id}
                              className="flex items-start gap-2 text-xs text-slate-700 sm:text-sm"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                              <span className="min-w-0">
                                <span className="font-semibold text-indigo-700">
                                  {d.cat}
                                </span>
                                <span className="text-slate-400"> — </span>
                                {d.nom}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {previewDetails.length > 3 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(expanded ? null : v.id)
                            }
                            className="mt-1.5 text-[11px] font-semibold text-indigo-700 hover:underline"
                          >
                            {expanded
                              ? "Réduire"
                              : `Voir les ${previewDetails.length - 3} autre${
                                  previewDetails.length - 3 > 1 ? "s" : ""
                                }`}
                          </button>
                        )}
                      </div>

                      <div className="mt-auto space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 sm:p-4">
                        <div className="space-y-1.5">
                          <label
                            htmlFor={`equipe-${v.id}`}
                            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"
                          >
                            <Users className="h-3.5 w-3.5" />
                            Équipe à affecter
                          </label>
                          {groupes.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-slate-200 px-3 py-3 text-center text-xs text-slate-500">
                              Aucune équipe disponible.
                            </p>
                          ) : (
                            <Select
                              value={groupeId || undefined}
                              onValueChange={(val) =>
                                setSelectedGroups((prev) => ({
                                  ...prev,
                                  [v.id]: val,
                                }))
                              }
                              disabled={busy}
                            >
                              <SelectTrigger
                                id={`equipe-${v.id}`}
                                className="h-12 rounded-xl border-slate-200 bg-white text-sm"
                              >
                                <SelectValue placeholder="Choisir une équipe…" />
                              </SelectTrigger>
                              <SelectContent>
                                {groupes.map((g) => {
                                  const chef = chefLabel(g);
                                  const count = g._count?.personnelSAVs;
                                  const extra = [
                                    typeof count === "number"
                                      ? `${count} membre${count > 1 ? "s" : ""}`
                                      : null,
                                    chef ? `Chef ${chef}` : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ");
                                  return (
                                    <SelectItem key={g.id} value={g.id}>
                                      {g.nom}
                                      {extra ? ` (${extra})` : ""}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        <DispatchModeButtons
                          disabled={busy || !groupeId || groupes.length === 0}
                          busy={busy}
                          busyMode={busy ? dispatchingMode : null}
                          onDispatch={(mode) => handleDispatch(v.id, mode)}
                        />

                        <p className="hidden items-center justify-center gap-1.5 text-[11px] text-slate-400 sm:flex">
                          Diagnostic fini
                          <ArrowRight className="h-3 w-3" />
                          Garantie ou Normal
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
