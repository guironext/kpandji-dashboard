"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Car,
  User,
  RefreshCw,
  Sparkles,
  CircleCheck,
  Gauge,
  Wrench,
  ListChecks,
  Route,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Palette,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    ClientSAV: ClientSAV;
  };
  DetailDiagnostic: DetailRow[];
  Maintenance: MaintenanceRow[];
};

type CheckKey =
  | "controleMoteur"
  | "controleEmbrayage"
  | "controleBoiteVitesses"
  | "controleDirection"
  | "controleSuspension"
  | "controleFreinage"
  | "controleTransmission"
  | "demarrageNormal"
  | "accelerationCorrecte"
  | "freinageEfficace"
  | "directionStable"
  | "absenceVibrations"
  | "absenceBruitAnormal";

type CheckSection = {
  title: string;
  icon: typeof Gauge;
  items: { key: CheckKey; label: string }[];
};

const CHECK_SECTIONS: CheckSection[] = [
  {
    title: "Contrôle mécanique",
    icon: Wrench,
    items: [
      { key: "controleMoteur", label: "Moteur" },
      { key: "controleEmbrayage", label: "Embrayage" },
      { key: "controleBoiteVitesses", label: "Boîte de vitesses" },
      { key: "controleDirection", label: "Direction" },
      { key: "controleSuspension", label: "Suspension" },
      { key: "controleFreinage", label: "Freinage" },
      { key: "controleTransmission", label: "Transmission" },
    ],
  },
  {
    title: "Essai routier",
    icon: Route,
    items: [
      { key: "demarrageNormal", label: "Démarrage normal" },
      { key: "accelerationCorrecte", label: "Accélération correcte" },
      { key: "freinageEfficace", label: "Freinage efficace" },
      { key: "directionStable", label: "Direction stable" },
      { key: "absenceVibrations", label: "Absence de vibrations" },
      { key: "absenceBruitAnormal", label: "Absence de bruit anormal" },
    ],
  },
];

const ALL_KEYS = CHECK_SECTIONS.flatMap((s) => s.items.map((i) => i.key));

function emptyChecks(): Record<CheckKey, boolean> {
  return Object.fromEntries(ALL_KEYS.map((k) => [k, false])) as Record<
    CheckKey,
    boolean
  >;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ProgressRing({
  value,
  size = 56,
  stroke = 5,
}: {
  value: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const done = value >= 100;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/60"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={cn(
            "transition-[stroke-dashoffset] duration-500 ease-out",
            done ? "text-emerald-500" : "text-teal-500",
          )}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums text-foreground">
        {value}%
      </span>
    </div>
  );
}

export default function TesteFinalClient() {
  const [reparations, setReparations] = useState<ReparationTeste[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [checks, setChecks] = useState<Record<CheckKey, boolean>>(emptyChecks);
  const [observations, setObservations] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    setChecks(emptyChecks());
    setObservations("");
  }, [selectedId]);

  const checkedCount = useMemo(
    () => ALL_KEYS.filter((k) => checks[k]).length,
    [checks],
  );
  const progress = Math.round((checkedCount / ALL_KEYS.length) * 100);
  const allChecked = checkedCount === ALL_KEYS.length;
  const remaining = ALL_KEYS.length - checkedCount;

  const toggleCheck = (key: CheckKey) => {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSection = (section: CheckSection, value: boolean) => {
    setChecks((prev) => {
      const next = { ...prev };
      for (const item of section.items) next[item.key] = value;
      return next;
    });
  };

  const markAll = (value: boolean) => {
    setChecks(
      Object.fromEntries(ALL_KEYS.map((k) => [k, value])) as Record<
        CheckKey,
        boolean
      >,
    );
  };

  const handleValidate = async () => {
    if (!selected) return;
    if (!allChecked) {
      toast.error("Tous les points de contrôle doivent être validés");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sav/reparation/${selected.id}`, {
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
      toast.success("Test final validé — véhicule terminé");
      setConfirmOpen(false);
      setReparations((prev) => {
        const remainingList = prev.filter((r) => r.id !== selected.id);
        setSelectedId(remainingList[0]?.id ?? "");
        return remainingList;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
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
    <div className="space-y-5 pb-28 sm:space-y-7 sm:pb-8">
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
                  Validation mécanique et essai routier avant clôture du dossier
                  et passage en facturation.
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
              <div className="flex min-w-[7.5rem] flex-1 flex-col justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md sm:min-w-[8.5rem] sm:flex-none">
                <span className="text-[10px] font-medium uppercase tracking-wide text-teal-100/80">
                  Points
                </span>
                <span className="mt-0.5 font-mono text-2xl font-semibold tabular-nums text-white">
                  {ALL_KEYS.length}
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

          {/* Detail + checklist */}
          {selected && (
            <div className="min-w-0 space-y-4 sm:space-y-5">
              {/* Vehicle summary */}
              <Card className="overflow-hidden border-border/60 shadow-sm ring-1 ring-black/[0.02] dark:ring-white/5">
                <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/50 via-muted/20 to-transparent pb-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="truncate text-lg sm:text-xl">
                          {selected.voitureSAV.model}
                        </CardTitle>
                        <Badge className="bg-teal-600 hover:bg-teal-600">
                          En test
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
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
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/80 px-3.5 py-2.5 sm:bg-background">
                      <ProgressRing value={progress} />
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Progression
                        </p>
                        <p className="text-sm font-semibold tabular-nums text-foreground">
                          {checkedCount}
                          <span className="font-normal text-muted-foreground">
                            /{ALL_KEYS.length}
                          </span>
                        </p>
                      </div>
                    </div>
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

              {/* Checklist header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold tracking-tight sm:text-lg">
                    Grille de contrôle
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Cochez chaque point après vérification sur le véhicule.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    onClick={() => markAll(true)}
                  >
                    Tout cocher
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    onClick={() => markAll(false)}
                  >
                    Réinitialiser
                  </Button>
                </div>
              </div>

              {/* Checklist sections */}
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                {CHECK_SECTIONS.map((section) => {
                  const SectionIcon = section.icon;
                  const sectionDone = section.items.every(
                    (i) => checks[i.key],
                  );
                  const sectionCount = section.items.filter(
                    (i) => checks[i.key],
                  ).length;
                  return (
                    <Card
                      key={section.title}
                      className={cn(
                        "border-border/60 shadow-sm transition-colors duration-300",
                        sectionDone &&
                          "border-emerald-400/50 bg-emerald-50/40 dark:border-emerald-500/30 dark:bg-emerald-950/20",
                      )}
                    >
                      <CardHeader className="pb-2.5 sm:pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                                sectionDone
                                  ? "bg-emerald-600 text-white"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              <SectionIcon className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <CardTitle className="truncate text-[15px] sm:text-base">
                                {section.title}
                              </CardTitle>
                              <p className="text-[11px] tabular-nums text-muted-foreground">
                                {sectionCount}/{section.items.length}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 shrink-0 px-2.5 text-xs"
                            onClick={() =>
                              toggleSection(section, !sectionDone)
                            }
                          >
                            {sectionDone ? "Décocher" : "Tout"}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-0.5 pb-3.5 sm:pb-4">
                        {section.items.map((item) => (
                          <label
                            key={item.key}
                            htmlFor={`check-${item.key}`}
                            className={cn(
                              "flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 transition-colors active:scale-[0.99]",
                              checks[item.key]
                                ? "bg-emerald-50/90 dark:bg-emerald-950/40"
                                : "hover:bg-muted/50",
                            )}
                          >
                            <Checkbox
                              id={`check-${item.key}`}
                              checked={checks[item.key]}
                              onCheckedChange={() => toggleCheck(item.key)}
                              className="h-5 w-5"
                            />
                            <span
                              className={cn(
                                "flex-1 text-sm leading-snug",
                                checks[item.key]
                                  ? "font-medium text-emerald-900 dark:text-emerald-100"
                                  : "text-foreground/90",
                              )}
                            >
                              {item.label}
                            </span>
                            {checks[item.key] && (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            )}
                          </label>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Observations + desktop CTA */}
              <Card className="border-border/60 shadow-sm">
                <CardContent className="space-y-4 pt-5 sm:pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="obs-final">
                      Observations du testeur{" "}
                      <span className="font-normal text-muted-foreground">
                        (optionnel)
                      </span>
                    </Label>
                    <Textarea
                      id="obs-final"
                      rows={3}
                      placeholder="Remarques sur l'essai, points d'attention, recommandations…"
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      className="min-h-[88px] resize-none"
                    />
                  </div>

                  {!allChecked && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3.5 py-3 text-sm text-amber-950 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <p>
                        Validez les {remaining} point
                        {remaining > 1 ? "s" : ""} restant
                        {remaining > 1 ? "s" : ""} avant de clôturer le dossier.
                      </p>
                    </div>
                  )}

                  {allChecked && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3.5 py-3 text-sm text-emerald-950 dark:border-emerald-500/25 dark:bg-emerald-950/30 dark:text-emerald-100">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <p>
                        Tous les points sont validés. Vous pouvez clôturer le
                        test final.
                      </p>
                    </div>
                  )}

                  {/* Desktop validate */}
                  <div className="hidden sm:flex sm:justify-end">
                    <Button
                      type="button"
                      size="lg"
                      disabled={!allChecked}
                      className="h-11 min-w-[240px] gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 font-semibold text-white shadow-md shadow-teal-600/20 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50"
                      onClick={() => setConfirmOpen(true)}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Valider le test final
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Mobile sticky CTA */}
      {selected && reparations.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-3 py-3 backdrop-blur-md sm:hidden supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted-foreground">
                {selected.voitureSAV.immatriculation}
              </p>
              <p className="text-sm font-semibold tabular-nums">
                {checkedCount}/{ALL_KEYS.length}
                <span className="ml-1.5 font-normal text-muted-foreground">
                  · {progress}%
                </span>
              </p>
            </div>
            <Button
              type="button"
              size="lg"
              disabled={!allChecked}
              className="h-11 shrink-0 gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 px-4 font-semibold text-white shadow-md shadow-teal-600/20 disabled:opacity-50"
              onClick={() => setConfirmOpen(true)}
            >
              <ShieldCheck className="h-4 w-4" />
              Valider
            </Button>
          </div>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          <div className="border-b border-border/60 bg-gradient-to-br from-teal-600/10 via-transparent to-emerald-600/5 px-6 pb-4 pt-6">
            <DialogHeader className="space-y-2 text-left">
              <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <DialogTitle>Confirmer le test final</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                Le véhicule{" "}
                <span className="font-semibold text-foreground">
                  {selected?.voitureSAV.immatriculation}
                </span>{" "}
                ({selected?.voitureSAV.model}) passera au statut « Terminé » et
                quittera cette liste. Il pourra ensuite être facturé.
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="gap-2 border-t border-border/50 bg-muted/20 px-6 py-4 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              className="sm:flex-1"
              onClick={() => setConfirmOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={submitting}
              className="bg-teal-600 hover:bg-teal-700 sm:flex-1"
              onClick={() => void handleValidate()}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validation…
                </>
              ) : (
                <>
                  <CircleCheck className="mr-2 h-4 w-4" />
                  Confirmer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
