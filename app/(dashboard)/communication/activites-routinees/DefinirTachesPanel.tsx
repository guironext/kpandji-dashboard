"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarRange,
  ClipboardList,
  ListChecks,
  Loader2,
  Plus,
  Trash2,
  UserCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ActiviteProjetRoutineListItem } from "@/lib/actions/activite-projet-routine";
import type { UserForRoleMissionOption } from "@/lib/actions/role-mission-projet-routine";
import {
  deleteTacheActiviteProjetRoutine,
  type TacheActiviteProjetRoutineListItem,
} from "@/lib/actions/tache-activite-projet-routine";
import AssignerTachesDialog from "./AssignerTachesDialog";

const STATUT_LABELS: Record<string, string> = {
  NOUVEAU: "Nouveau",
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  EN_ATTENTE_VALIDATION: "En attente validation",
  VALIDEE: "Validée",
  NON_VALIDEE: "Non validée",
  TRANSFEREE: "Transférée",
  TERMINEE: "Terminée",
  ANNULE: "Annulée",
};

const STATUT_STYLES: Record<string, string> = {
  NOUVEAU: "bg-slate-100 text-slate-700 border-slate-200",
  EN_ATTENTE: "bg-amber-50 text-amber-800 border-amber-200",
  EN_COURS: "bg-sky-50 text-sky-800 border-sky-200",
  EN_ATTENTE_VALIDATION: "bg-violet-50 text-violet-800 border-violet-200",
  VALIDEE: "bg-emerald-50 text-emerald-800 border-emerald-200",
  NON_VALIDEE: "bg-rose-50 text-rose-800 border-rose-200",
  TRANSFEREE: "bg-indigo-50 text-indigo-800 border-indigo-200",
  TERMINEE: "bg-teal-50 text-teal-800 border-teal-200",
  ANNULE: "bg-slate-100 text-slate-500 border-slate-200",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type Props = {
  initialTaches: TacheActiviteProjetRoutineListItem[];
  activites: ActiviteProjetRoutineListItem[];
  users: UserForRoleMissionOption[];
};

export default function DefinirTachesPanel({ initialTaches, activites, users }: Props) {
  const [taches, setTaches] = useState(initialTaches);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const groupedByActivite = useMemo(() => {
    const groups = new Map<
      string,
      {
        activiteLibelle: string;
        activiteMois: string | null;
        roleMissionLibelle: string;
        taches: TacheActiviteProjetRoutineListItem[];
      }
    >();

    for (const tache of taches) {
      const key = tache.activiteProjetRoutineId;
      const existing = groups.get(key);
      if (existing) {
        existing.taches.push(tache);
      } else {
        groups.set(key, {
          activiteLibelle: tache.activiteLibelle,
          activiteMois: tache.activiteMois,
          roleMissionLibelle: tache.roleMissionLibelle,
          taches: [tache],
        });
      }
    }

    return Array.from(groups.values());
  }, [taches]);

  const responsablesCount = useMemo(() => {
    const ids = new Set<string>();
    for (const tache of taches) {
      for (const r of tache.responsables) {
        ids.add(r.userId);
      }
    }
    return ids.size;
  }, [taches]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteTacheActiviteProjetRoutine(id);
    setDeletingId(null);

    if (result.success) {
      setTaches((prev) => prev.filter((t) => t.id !== id));
      toast.success("Tâche supprimée.");
    } else {
      toast.error(result.error);
    }
  }

  async function refreshTaches() {
    const { getTachesActiviteProjetRoutine } = await import(
      "@/lib/actions/tache-activite-projet-routine"
    );
    const result = await getTachesActiviteProjetRoutine();
    if (result.success) {
      setTaches(result.taches);
    }
  }

  return (
    <div className="pb-4 sm:pb-6">
      <div className="border-b border-amber-100/80 bg-gradient-to-r from-amber-50/80 via-white to-orange-50/50 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:max-w-xl">
            {[
              { label: "Tâches", value: taches.length },
              { label: "Activités", value: groupedByActivite.length },
              { label: "Responsables", value: responsablesCount },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/80 bg-white/90 px-3 py-2.5 shadow-sm ring-1 ring-slate-100"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {stat.label}
                </p>
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>

          <Button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 px-5 shadow-lg shadow-amber-500/25 lg:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Assigner Tâches
          </Button>
        </div>

        {activites.length === 0 && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 sm:text-sm">
            Créez d&apos;abord des activités à l&apos;étape 3.
          </p>
        )}
      </div>

      <div className="px-4 pt-4 sm:px-6 sm:pt-5">
        {taches.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-200 bg-amber-50/40 px-5 py-12 text-center sm:py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-white shadow-xl">
              <ListChecks className="h-8 w-8" />
            </div>
            <p className="text-lg font-bold text-slate-900">Aucune tâche définie</p>
            <p className="mt-2 max-w-md text-sm text-slate-600">
              Assignez des tâches concrètes à vos activités routinières et désignez un responsable
              pour chacune.
            </p>
            <Button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="mt-6 rounded-xl bg-amber-600 hover:bg-amber-700"
              disabled={activites.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Assigner Tâches
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByActivite.map((group) => (
              <section key={group.activiteLibelle + group.roleMissionLibelle} className="space-y-3">
                <div className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50/80 to-orange-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                        Activité · {group.roleMissionLibelle}
                      </p>
                      <p className="truncate text-base font-bold text-slate-900">
                        {group.activiteLibelle}
                      </p>
                      {group.activiteMois && (
                        <p className="truncate text-xs capitalize text-amber-700">
                          {group.activiteMois}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge className="w-fit rounded-full border-amber-200 bg-white text-amber-800">
                    {group.taches.length} tâche{group.taches.length !== 1 ? "s" : ""}
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {group.taches.map((tache) => {
                    const responsable = tache.responsables[0];

                    return (
                      <article
                        key={tache.id}
                        className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-100/50"
                      >
                        <div className="border-b border-amber-100 bg-gradient-to-r from-amber-500/10 to-orange-500/5 px-4 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "mb-2 rounded-full border",
                                  STATUT_STYLES[tache.statutTache] ?? STATUT_STYLES.NOUVEAU
                                )}
                              >
                                {STATUT_LABELS[tache.statutTache] ?? tache.statutTache}
                              </Badge>
                              <h3 className="text-base font-bold text-slate-900">{tache.libelle}</h3>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 shrink-0 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                              onClick={() => handleDelete(tache.id)}
                              disabled={deletingId === tache.id}
                              aria-label="Supprimer la tâche"
                            >
                              {deletingId === tache.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3 px-4 py-4">
                          {tache.description && (
                            <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
                              {tache.description}
                            </p>
                          )}

                          {responsable ? (
                            <div className="flex items-center gap-2.5 rounded-xl border border-amber-100 bg-amber-50/50 p-2.5">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-xs font-bold text-white">
                                {initials(responsable.userName)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                  Responsable
                                </p>
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {responsable.userName}
                                </p>
                                <p className="truncate text-xs text-slate-500">
                                  {responsable.userEmail}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-500">
                              <UserCircle2 className="h-4 w-4" />
                              Sans responsable
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                              <CalendarRange className="h-3.5 w-3.5" />
                              {format(new Date(tache.dateDebut), "d MMM yyyy", { locale: fr })}
                              {tache.dateCloture &&
                                ` → ${format(new Date(tache.dateCloture), "d MMM yyyy", { locale: fr })}`}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-800">
                              <ListChecks className="h-3.5 w-3.5" />
                              {tache.activiteLibelle}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <AssignerTachesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        activites={activites}
        users={users}
        onSuccess={refreshTaches}
      />
    </div>
  );
}
