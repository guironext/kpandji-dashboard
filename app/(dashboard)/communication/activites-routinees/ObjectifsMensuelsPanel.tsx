"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  UserCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RoleMissionProjetRoutineListItem } from "@/lib/actions/role-mission-projet-routine";
import {
  deleteIndicateurObjectifMensuelProjetRoutine,
  type IndicateurObjectifMensuelListItem,
} from "@/lib/actions/indicateur-objectif-mensuel-projet-routine";
import AssignerObjectifMensuelDialog from "./AssignerObjectifMensuelDialog";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function progressPercent(objectif: IndicateurObjectifMensuelListItem) {
  if (objectif.nombreObjectifsMensuels <= 0) return 0;
  return Math.min(
    100,
    Math.round(
      (objectif.nombreObjectifsMensuelsAtteints / objectif.nombreObjectifsMensuels) * 100
    )
  );
}

type Props = {
  initialObjectifs: IndicateurObjectifMensuelListItem[];
  roles: RoleMissionProjetRoutineListItem[];
};

export default function ObjectifsMensuelsPanel({ initialObjectifs, roles }: Props) {
  const [objectifs, setObjectifs] = useState(initialObjectifs);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const groupedByResponsable = useMemo(() => {
    const groups = new Map<
      string,
      {
        responsable: IndicateurObjectifMensuelListItem["responsable"];
        roleMissionLibelle: string;
        objectifs: IndicateurObjectifMensuelListItem[];
      }
    >();

    for (const objectif of objectifs) {
      const key = objectif.responsable?.userId ?? `role-${objectif.roleMissionProjetRoutineId}`;
      const existing = groups.get(key);
      if (existing) {
        existing.objectifs.push(objectif);
      } else {
        groups.set(key, {
          responsable: objectif.responsable,
          roleMissionLibelle: objectif.roleMissionLibelle,
          objectifs: [objectif],
        });
      }
    }

    return Array.from(groups.values());
  }, [objectifs]);

  const stats = useMemo(() => {
    const totalCible = objectifs.reduce((sum, o) => sum + o.nombreObjectifsMensuels, 0);
    const totalAtteints = objectifs.reduce((sum, o) => sum + o.nombreObjectifsMensuelsAtteints, 0);
    const totalNonAtteints = objectifs.reduce(
      (sum, o) => sum + o.nombreObjectifsMensuelsNonAtteints,
      0
    );
    const avgProgress =
      objectifs.length > 0
        ? Math.round(
            objectifs.reduce((sum, o) => sum + progressPercent(o), 0) / objectifs.length
          )
        : 0;

    return { totalCible, totalAtteints, totalNonAtteints, avgProgress };
  }, [objectifs]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteIndicateurObjectifMensuelProjetRoutine(id);
    setDeletingId(null);

    if (result.success) {
      setObjectifs((prev) => prev.filter((objectif) => objectif.id !== id));
      toast.success("Objectif mensuel supprimé.");
    } else {
      toast.error(result.error);
    }
  }

  async function refreshObjectifs() {
    const { getIndicateursObjectifMensuelProjetRoutine } = await import(
      "@/lib/actions/indicateur-objectif-mensuel-projet-routine"
    );
    const result = await getIndicateursObjectifMensuelProjetRoutine();
    if (result.success) {
      setObjectifs(result.objectifs);
    }
  }

  return (
    <div className="pb-4 sm:pb-6">
      {/* Toolbar + stats */}
      <div className="border-b border-emerald-100/80 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/50 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:max-w-2xl lg:flex-1">
            {[
              {
                label: "Indicateurs",
                value: objectifs.length,
                icon: Target,
                tone: "text-emerald-700 bg-emerald-100",
              },
              {
                label: "Cible totale",
                value: stats.totalCible,
                icon: TrendingUp,
                tone: "text-sky-700 bg-sky-100",
              },
              {
                label: "Atteints",
                value: stats.totalAtteints,
                icon: CheckCircle2,
                tone: "text-green-700 bg-green-100",
              },
              {
                label: "Progression",
                value: `${stats.avgProgress}%`,
                icon: TrendingUp,
                tone: "text-teal-700 bg-teal-100",
                wide: true,
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={cn(
                    "flex items-center gap-2.5 rounded-2xl border border-white/80 bg-white/90 px-3 py-2.5 shadow-sm ring-1 ring-slate-100",
                    stat.wide && "col-span-2 sm:col-span-1"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      stat.tone
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {stat.label}
                    </p>
                    <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="h-12 w-full shrink-0 rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 px-5 shadow-lg shadow-emerald-500/25 transition hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 active:scale-[0.98] lg:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Assigner Objectifs Mensuels
          </Button>
        </div>

        {roles.length === 0 && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 sm:text-sm">
            Créez d&apos;abord un rôle et mission à l&apos;étape 1 pour pouvoir assigner des
            objectifs mensuels.
          </p>
        )}
      </div>

      <div className="px-4 pt-4 sm:px-6 sm:pt-5">
        {objectifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-gradient-to-b from-emerald-50/60 to-white px-5 py-12 text-center sm:px-8 sm:py-16">
            <div className="relative mb-5">
              <div className="absolute inset-0 scale-150 rounded-full bg-emerald-200/40 blur-2xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 text-white shadow-xl">
                <Target className="h-8 w-8" />
              </div>
            </div>
            <p className="text-lg font-bold text-slate-900">Aucun objectif mensuel</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
              Assignez un indicateur mensuel à un rôle pour suivre la performance du responsable
              en temps réel.
            </p>
            <Button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="mt-6 h-11 w-full max-w-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 sm:w-auto"
              disabled={roles.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Assigner Objectifs Mensuels
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByResponsable.map((group) => {
              const responsable = group.responsable;
              const groupKey = responsable?.userId ?? group.roleMissionLibelle;

              return (
                <section key={groupKey} className="space-y-3">
                  <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/80 to-teal-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {responsable ? (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-md">
                          {initials(responsable.userName)}
                        </div>
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
                          <UserCircle2 className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                          Responsable · {group.roleMissionLibelle}
                        </p>
                        <p className="truncate text-base font-bold text-slate-900">
                          {responsable?.userName ?? "Sans responsable"}
                        </p>
                        {responsable && (
                          <p className="truncate text-xs text-slate-500">{responsable.userEmail}</p>
                        )}
                      </div>
                    </div>
                    <Badge className="w-fit shrink-0 rounded-full border-emerald-200 bg-white text-emerald-800">
                      {group.objectifs.length} objectif{group.objectifs.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {group.objectifs.map((objectif) => {
                      const pct = progressPercent(objectif);

                      return (
                        <article
                          key={objectif.id}
                          className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-100/50"
                        >
                          <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-500/10 via-green-500/5 to-teal-500/5 px-4 py-4">
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <h3 className="text-base font-bold leading-snug text-slate-900 sm:text-[1.05rem]">
                                  {objectif.libelle}
                                </h3>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 shrink-0 rounded-xl text-slate-400 opacity-100 transition hover:bg-rose-50 hover:text-rose-600 sm:opacity-70 sm:group-hover:opacity-100"
                                onClick={() => handleDelete(objectif.id)}
                                disabled={deletingId === objectif.id}
                                aria-label="Supprimer l'objectif mensuel"
                              >
                                {deletingId === objectif.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-medium">
                                <span className="text-emerald-700">Progression</span>
                                <span className="text-slate-600">{pct}%</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 px-4 py-4">
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                Objectif mensuel
                              </p>
                              <p className="mt-1 text-sm leading-relaxed text-slate-700">
                                {objectif.objectifMensuel}
                              </p>
                            </div>

                            {objectif.description && (
                              <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">
                                {objectif.description}
                              </p>
                            )}

                            <div className="grid grid-cols-3 gap-2">
                              {[
                                {
                                  label: "Total",
                                  value: objectif.nombreObjectifsMensuels,
                                  icon: Target,
                                  className: "border-slate-100 bg-slate-50/80 text-slate-900",
                                  iconClass: "text-slate-500",
                                },
                                {
                                  label: "Atteints",
                                  value: objectif.nombreObjectifsMensuelsAtteints,
                                  icon: CheckCircle2,
                                  className: "border-emerald-100 bg-emerald-50/70 text-emerald-800",
                                  iconClass: "text-emerald-600",
                                },
                                {
                                  label: "Restants",
                                  value: objectif.nombreObjectifsMensuelsNonAtteints,
                                  icon: XCircle,
                                  className: "border-rose-100 bg-rose-50/70 text-rose-800",
                                  iconClass: "text-rose-600",
                                },
                              ].map((item) => {
                                const Icon = item.icon;
                                return (
                                  <div
                                    key={item.label}
                                    className={cn(
                                      "rounded-xl border p-2.5 text-center sm:p-3",
                                      item.className
                                    )}
                                  >
                                    <Icon
                                      className={cn(
                                        "mx-auto mb-1 h-4 w-4 sm:h-3.5 sm:w-3.5",
                                        item.iconClass
                                      )}
                                    />
                                    <p className="text-base font-bold sm:text-lg">{item.value}</p>
                                    <p className="text-[9px] font-semibold uppercase tracking-wide opacity-80 sm:text-[10px]">
                                      {item.label}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <AssignerObjectifMensuelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        roles={roles}
        onSuccess={refreshObjectifs}
      />
    </div>
  );
}
