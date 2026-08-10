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
import type { RoleMissionProjetRoutineListItem } from "@/lib/actions/role-mission-projet-routine";
import {
  deleteActiviteProjetRoutine,
  type ActiviteProjetRoutineListItem,
} from "@/lib/actions/activite-projet-routine";
import AjouterActivitesDialog from "./AjouterActivitesDialog";

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
  initialActivites: ActiviteProjetRoutineListItem[];
  roles: RoleMissionProjetRoutineListItem[];
};

export default function DefinirActivitePanel({ initialActivites, roles }: Props) {
  const [activites, setActivites] = useState(initialActivites);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const groupedByResponsable = useMemo(() => {
    const groups = new Map<
      string,
      {
        responsable: ActiviteProjetRoutineListItem["responsable"];
        roleMissionLibelle: string;
        activites: ActiviteProjetRoutineListItem[];
      }
    >();

    for (const activite of activites) {
      const key = activite.responsable?.userId ?? `role-${activite.roleMissionProjetRoutineId}`;
      const existing = groups.get(key);
      if (existing) {
        existing.activites.push(activite);
      } else {
        groups.set(key, {
          responsable: activite.responsable,
          roleMissionLibelle: activite.roleMissionLibelle,
          activites: [activite],
        });
      }
    }

    return Array.from(groups.values());
  }, [activites]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteActiviteProjetRoutine(id);
    setDeletingId(null);

    if (result.success) {
      setActivites((prev) => prev.filter((a) => a.id !== id));
      toast.success("Activité supprimée.");
    } else {
      toast.error(result.error);
    }
  }

  async function refreshActivites() {
    const { getActivitesProjetRoutine } = await import("@/lib/actions/activite-projet-routine");
    const result = await getActivitesProjetRoutine();
    if (result.success) {
      setActivites(result.activites);
    }
  }

  return (
    <div className="pb-4 sm:pb-6">
      <div className="border-b border-violet-100/80 bg-gradient-to-r from-violet-50/80 via-white to-fuchsia-50/50 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:max-w-xl">
            {[
              { label: "Activités", value: activites.length },
              { label: "Responsables", value: groupedByResponsable.length },
              {
                label: "Tâches liées",
                value: activites.reduce((s, a) => s + a.tachesCount, 0),
              },
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
            className="h-12 w-full rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 shadow-lg shadow-violet-500/25 lg:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter Activités
          </Button>
        </div>

        {roles.length === 0 && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 sm:text-sm">
            Créez d&apos;abord un rôle et mission à l&apos;étape 1.
          </p>
        )}
      </div>

      <div className="px-4 pt-4 sm:px-6 sm:pt-5">
        {activites.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 px-5 py-12 text-center sm:py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 text-white shadow-xl">
              <ClipboardList className="h-8 w-8" />
            </div>
            <p className="text-lg font-bold text-slate-900">Aucune activité planifiée</p>
            <p className="mt-2 max-w-md text-sm text-slate-600">
              Ajoutez des activités routinières liées à vos rôles et responsables.
            </p>
            <Button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="mt-6 rounded-xl bg-violet-600 hover:bg-violet-700"
              disabled={roles.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter Activités
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByResponsable.map((group) => {
              const responsable = group.responsable;
              const groupKey = responsable?.userId ?? group.roleMissionLibelle;

              return (
                <section key={groupKey} className="space-y-3">
                  <div className="flex flex-col gap-3 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50/80 to-fuchsia-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {responsable ? (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-bold text-white shadow-md">
                          {initials(responsable.userName)}
                        </div>
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200">
                          <UserCircle2 className="h-5 w-5 text-slate-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
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
                    <Badge className="w-fit rounded-full border-violet-200 bg-white text-violet-800">
                      {group.activites.length} activité{group.activites.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {group.activites.map((activite) => (
                      <article
                        key={activite.id}
                        className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-100/50"
                      >
                        <div className="border-b border-violet-100 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/5 px-4 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "mb-2 rounded-full border",
                                  STATUT_STYLES[activite.statutActivite] ??
                                    STATUT_STYLES.NOUVEAU
                                )}
                              >
                                {STATUT_LABELS[activite.statutActivite] ?? activite.statutActivite}
                              </Badge>
                              <h3 className="text-base font-bold text-slate-900">{activite.libelle}</h3>
                              {activite.mois && (
                                <p className="mt-1 text-xs capitalize text-violet-700">
                                  {activite.mois}
                                </p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 shrink-0 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                              onClick={() => handleDelete(activite.id)}
                              disabled={deletingId === activite.id}
                              aria-label="Supprimer l'activité"
                            >
                              {deletingId === activite.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3 px-4 py-4">
                          {activite.description && (
                            <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
                              {activite.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                              <CalendarRange className="h-3.5 w-3.5" />
                              {format(new Date(activite.dateDebut), "d MMM yyyy", { locale: fr })}
                              {activite.dateCloture &&
                                ` → ${format(new Date(activite.dateCloture), "d MMM yyyy", { locale: fr })}`}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-violet-800">
                              <ListChecks className="h-3.5 w-3.5" />
                              {activite.tachesCount} tâche{activite.tachesCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <AjouterActivitesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        roles={roles}
        onSuccess={refreshActivites}
      />
    </div>
  );
}
