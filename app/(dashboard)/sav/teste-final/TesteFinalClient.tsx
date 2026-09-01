"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Car,
  User,
  RefreshCw,
  Sparkles,
  CircleCheck,
  Wrench,
  ListChecks,
  CheckCircle2,
  Palette,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import CheckListVerificationForm from "../diagnostique-arrivee/CheckListVerificationForm";

type ClientSAV = { nom: string; prenom: string; contact?: string | null };

type PieceRow = {
  id: string;
  nom: string;
  part_code: string | null;
  quantiteSortieDetail: number;
};

type DetailRow = {
  id: string;
  nom: string;
  description: string | null;
  catergorieDiagnostic: { id: string; nom: string };
  PieceSAV: PieceRow[];
};

type MaintenanceRow = {
  id: string;
  nom: string;
  description: string | null;
  duree_maintenance: string | null;
  statut: string;
  catergorieDiagnostic: { id: string; nom: string } | null;
};

export type ReparationTeste = {
  id: string;
  categorie_reparation: string;
  detail_reparation: string | null;
  updatedAt: string;
  voitureSAV: {
    id: string;
    immatriculation: string;
    model: string;
    couleur: string;
    chassisNumber?: string | null;
    ClientSAV: ClientSAV;
  };
  DetailDiagnostic: DetailRow[];
  Maintenance: MaintenanceRow[];
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TesteFinalClient() {
  const [reparations, setReparations] = useState<ReparationTeste[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState("");

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/sav/reparations-en-teste");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Chargement impossible");
      }
      const data: ReparationTeste[] = json.data ?? [];
      setReparations(data);
      setSelectedId((prev) => {
        if (prev && data.some((r) => r.id === prev)) return prev;
        return data[0]?.id ?? "";
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(
    () => reparations.find((r) => r.id === selectedId) ?? null,
    [reparations, selectedId],
  );

  const completeReparation = async (reparationId: string, observations: string) => {
    const res = await fetch(`/api/sav/reparation/${reparationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        statut: "TERMINE",
        observations: observations.trim() || "Contrôle final validé",
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Validation impossible");
    }
    setReparations((prev) => {
      const remainingList = prev.filter((r) => r.id !== reparationId);
      setSelectedId(remainingList[0]?.id ?? "");
      return remainingList;
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[min(60vh,420px)] flex-col items-center justify-center gap-5 rounded-2xl border border-border/60 bg-gradient-to-b from-card to-muted/20 px-6 py-16 text-center shadow-sm sm:rounded-3xl">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse rounded-2xl bg-teal-500/20 blur-xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700 ring-1 ring-teal-500/20 dark:text-teal-300">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-foreground">
            Chargement des tests finaux
          </p>
          <p className="text-xs text-muted-foreground">
            Véhicules en attente de contrôle…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 sm:space-y-7">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-teal-900/10 bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 shadow-[0_20px_50px_-18px_rgba(15,118,110,0.5)] sm:rounded-3xl dark:border-teal-400/10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl sm:h-64 sm:w-64"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/4 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl"
          aria-hidden
        />

        <div className="relative px-4 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-11">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-teal-50/95 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-200" aria-hidden />
                Contrôle qualité · SAV
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-[2.35rem] lg:leading-tight">
                  Teste final
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-teal-50/85 sm:text-base">
                  Grille de contrôle CheckListsSAV (type Teste finale) avant
                  clôture du dossier et passage en facturation.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-stretch gap-2.5 sm:gap-3">
              <div className="flex min-w-[7.5rem] flex-1 flex-col justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md sm:min-w-[8.5rem] sm:flex-none">
                <span className="text-[10px] font-medium uppercase tracking-wide text-teal-100/80">
                  En attente
                </span>
                <span className="mt-0.5 font-mono text-2xl font-semibold tabular-nums text-white">
                  {reparations.length}
                </span>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-auto min-h-[3.25rem] self-stretch border border-white/20 bg-white/15 px-4 text-white hover:bg-white/25 hover:text-white"
                disabled={refreshing}
                onClick={() => void load({ silent: true })}
              >
                <RefreshCw
                  className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")}
                />
                Actualiser
              </Button>
            </div>
          </div>
        </div>
      </section>

      {reparations.length === 0 ? (
        <Card className="overflow-hidden border-dashed border-border/70 shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 px-4 py-14 text-center sm:py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/15 dark:text-emerald-400">
              <CircleCheck className="h-8 w-8" />
            </div>
            <div className="max-w-md space-y-1.5">
              <p className="text-base font-semibold text-foreground">
                Aucun véhicule en test final
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Les dossiers apparaîtront ici dès qu&apos;une maintenance sera
                terminée et envoyée au contrôle qualité.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-6">
          {/* Vehicle list */}
          <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
            <div className="flex items-center justify-between px-0.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Dossiers
              </p>
              <Badge variant="secondary" className="tabular-nums">
                {reparations.length}
              </Badge>
            </div>

            {/* Mobile / tablet: horizontal chips */}
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 snap-x snap-mandatory [scrollbar-width:thin] lg:hidden">
              {reparations.map((rep) => {
                const c = rep.voitureSAV.ClientSAV;
                const active = rep.id === selectedId;
                return (
                  <button
                    key={rep.id}
                    type="button"
                    onClick={() => setSelectedId(rep.id)}
                    className={cn(
                      "snap-start min-w-[12rem] shrink-0 rounded-2xl border px-3.5 py-3 text-left transition-all duration-200",
                      active
                        ? "border-teal-500/45 bg-teal-50 shadow-md shadow-teal-600/10 ring-1 ring-teal-500/20 dark:border-teal-400/40 dark:bg-teal-950/50 dark:shadow-none"
                        : "border-border/70 bg-card hover:border-teal-300/50 hover:bg-muted/40 dark:hover:border-teal-500/30",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                          active
                            ? "bg-teal-600 text-white"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Car className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {c.prenom} {c.nom}
                        </p>
                        <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                          {rep.voitureSAV.immatriculation}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Desktop vertical list */}
            <div className="hidden max-h-[calc(100vh-12rem)] space-y-2 overflow-y-auto pr-0.5 [scrollbar-width:thin] lg:block">
              {reparations.map((rep) => {
                const c = rep.voitureSAV.ClientSAV;
                const active = rep.id === selectedId;
                return (
                  <button
                    key={rep.id}
                    type="button"
                    onClick={() => setSelectedId(rep.id)}
                    className={cn(
                      "group w-full rounded-2xl border px-3.5 py-3.5 text-left transition-all duration-200",
                      active
                        ? "border-teal-500/40 bg-gradient-to-br from-teal-50 to-cyan-50/70 shadow-md shadow-teal-600/10 ring-1 ring-teal-500/20 dark:from-teal-950/60 dark:to-cyan-950/30 dark:shadow-none"
                        : "border-border/70 bg-card hover:border-teal-300/40 hover:bg-muted/30 hover:shadow-sm dark:hover:border-teal-500/25",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                          active
                            ? "bg-teal-600 text-white shadow-sm"
                            : "bg-muted text-muted-foreground group-hover:bg-teal-100 group-hover:text-teal-700 dark:group-hover:bg-teal-900/50 dark:group-hover:text-teal-300",
                        )}
                      >
                        <Car className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {c.prenom} {c.nom}
                        </p>
                        <p className="mt-0.5 truncate font-mono text-xs tabular-nums text-muted-foreground">
                          {rep.voitureSAV.immatriculation}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-muted-foreground">
                          {rep.voitureSAV.model}
                        </p>
                      </div>
                      {active && (
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {selected && (
            <div className="min-w-0 space-y-4 sm:space-y-5">
              <Card className="overflow-hidden border-border/60 shadow-sm ring-1 ring-black/[0.02] dark:ring-white/5">
                <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/50 via-muted/20 to-transparent pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="truncate text-lg sm:text-xl">
                      {selected.voitureSAV.model}
                    </CardTitle>
                    <Badge className="bg-teal-600 hover:bg-teal-600">
                      En test
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="gap-1 font-mono text-[11px] sm:text-xs"
                    >
                      <Car className="h-3 w-3" />
                      {selected.voitureSAV.immatriculation}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="gap-1 text-[11px] sm:text-xs"
                    >
                      <User className="h-3 w-3" />
                      {selected.voitureSAV.ClientSAV.prenom}{" "}
                      {selected.voitureSAV.ClientSAV.nom}
                    </Badge>
                    {selected.voitureSAV.couleur && (
                      <Badge
                        variant="outline"
                        className="gap-1 text-[11px] sm:text-xs"
                      >
                        <Palette className="h-3 w-3" />
                        {selected.voitureSAV.couleur}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="gap-1 text-[11px] sm:text-xs"
                    >
                      <Clock className="h-3 w-3" />
                      {formatDate(selected.updatedAt)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="grid gap-3 pt-4 sm:grid-cols-2 sm:gap-4 sm:pt-5">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 sm:p-4">
                    <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <ListChecks className="h-3.5 w-3.5" />
                      Diagnostics traités
                    </p>
                    <ul className="space-y-1.5 text-sm">
                      {(selected.DetailDiagnostic ?? []).slice(0, 4).map((d) => (
                        <li key={d.id} className="truncate text-foreground/90">
                          <span className="text-muted-foreground">
                            {d.catergorieDiagnostic?.nom} —
                          </span>{" "}
                          {d.nom}
                        </li>
                      ))}
                      {(selected.DetailDiagnostic?.length ?? 0) === 0 && (
                        <li className="text-muted-foreground">Aucun détail</li>
                      )}
                      {(selected.DetailDiagnostic?.length ?? 0) > 4 && (
                        <li className="text-xs text-muted-foreground">
                          +{(selected.DetailDiagnostic?.length ?? 0) - 4} autres
                        </li>
                      )}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 sm:p-4">
                    <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <Wrench className="h-3.5 w-3.5" />
                      Maintenances
                    </p>
                    <ul className="space-y-1.5 text-sm">
                      {(selected.Maintenance ?? []).slice(0, 4).map((m) => (
                        <li
                          key={m.id}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="truncate">{m.nom}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0 text-[10px]",
                              m.statut === "TERMINEE" &&
                                "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
                            )}
                          >
                            {m.statut === "TERMINEE" ? "OK" : m.statut}
                          </Badge>
                        </li>
                      ))}
                      {(selected.Maintenance?.length ?? 0) === 0 && (
                        <li className="text-muted-foreground">
                          Aucune maintenance
                        </li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <div>
                <h2 className="text-base font-semibold tracking-tight sm:text-lg">
                  Grille de contrôle
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Check-list CheckListsSAV — type verrouillé sur Teste finale.
                </p>
              </div>

              <CheckListVerificationForm
                key={selected.voitureSAV.id}
                voiture={{
                  id: selected.voitureSAV.id,
                  model: selected.voitureSAV.model,
                  immatriculation: selected.voitureSAV.immatriculation,
                  chassisNumber: selected.voitureSAV.chassisNumber,
                  couleur: selected.voitureSAV.couleur,
                  statut: "TESTE",
                  ClientSAV: {
                    nom: selected.voitureSAV.ClientSAV.nom,
                    prenom: selected.voitureSAV.ClientSAV.prenom,
                    contact: selected.voitureSAV.ClientSAV.contact ?? undefined,
                  },
                }}
                defaultType="FINALE"
                allowedTypes={["FINALE"]}
                requireAllChecked
                showDraftButton={false}
                footerHint="Check-list de test final"
                validateSuccessMessage="Test final validé — véhicule terminé"
                onSaved={async (payload) => {
                  await completeReparation(
                    selected.id,
                    payload?.observations ?? "",
                  );
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
