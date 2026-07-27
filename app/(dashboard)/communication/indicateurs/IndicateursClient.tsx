"use client";

import { useMemo, useState, type ReactNode } from "react";
import { format } from "date-fns";
import {
  ClipboardList,
  FolderKanban,
  Layers,
  ListChecks,
  RefreshCw,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getCommunicationIndicateurs,
  type CommunicationIndicateursData,
  type IndicateurPerson,
} from "@/lib/actions/communication-indicateurs";
import {
  ACTIVITE_STATUT_COLUMNS,
  getActiviteStatutConfig,
} from "@/lib/projet-ponctuel-activite-statut";
import {
  TACHE_STATUT_COLUMNS,
  getTacheStatutConfig,
} from "@/lib/tache-activite-projet-routine-statut";

type Props = {
  initialData: CommunicationIndicateursData;
  initialError: string | null;
};

const PROJET_STATUT_COLUMNS = [
  {
    value: "EN_ATTENTE" as const,
    label: "En attente",
    headerClass: "from-slate-500/15 to-slate-400/5 border-slate-200",
    dotClass: "bg-slate-400",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
  {
    value: "EN_COURS" as const,
    label: "En cours",
    headerClass: "from-sky-500/15 to-cyan-500/5 border-sky-200",
    dotClass: "bg-sky-500",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
  },
  {
    value: "TERMINEE" as const,
    label: "Terminée",
    headerClass: "from-emerald-500/15 to-teal-500/5 border-emerald-200",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    value: "ANNULE" as const,
    label: "Annulée",
    headerClass: "from-rose-500/15 to-pink-500/5 border-rose-200",
    dotClass: "bg-rose-500",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
  },
];

const SANS_RESPONSABLE_KEY = "__none__";

function formatDate(value: string | null) {
  if (!value) return "—";
  // Numeric format avoids SSR/client locale month-name mismatches
  return format(new Date(value), "dd/MM/yyyy");
}

function initials(person: IndicateurPerson | null | undefined, fallback = "?") {
  if (!person) return fallback;
  return `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`.toUpperCase();
}

function personKey(person: IndicateurPerson | null | undefined) {
  return person?.userId ?? SANS_RESPONSABLE_KEY;
}

function personLabel(person: IndicateurPerson | null | undefined) {
  return person?.fullName ?? "Sans responsable";
}

type ResponsableGroup<T> = {
  key: string;
  person: IndicateurPerson | null;
  items: T[];
};

function groupByResponsable<T>(
  items: T[],
  getResponsables: (item: T) => IndicateurPerson[]
): ResponsableGroup<T>[] {
  const map = new Map<string, ResponsableGroup<T>>();

  for (const item of items) {
    const responsables = getResponsables(item);
    const targets =
      responsables.length > 0
        ? responsables
        : ([null] as Array<IndicateurPerson | null>);

    for (const person of targets) {
      const key = personKey(person);
      const existing = map.get(key);
      if (existing) {
        existing.items.push(item);
      } else {
        map.set(key, { key, person, items: [item] });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.key === SANS_RESPONSABLE_KEY) return 1;
    if (b.key === SANS_RESPONSABLE_KEY) return -1;
    return personLabel(a.person).localeCompare(personLabel(b.person), "fr");
  });
}

function StatutSummaryBar({
  columns,
  counts,
  accent,
}: {
  columns: Array<{ value: string; label: string; dotClass: string }>;
  counts: Record<string, number>;
  accent: "amber" | "teal";
}) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 rounded-2xl border bg-white/80 p-3 shadow-sm",
        accent === "amber" ? "border-amber-100" : "border-teal-100"
      )}
    >
      <Badge
        variant="outline"
        className={cn(
          "border-0 px-3 py-1 text-sm font-semibold",
          accent === "amber"
            ? "bg-amber-50 text-amber-800"
            : "bg-teal-50 text-teal-800"
        )}
      >
        {total} au total
      </Badge>
      {columns.map((col) => (
        <div
          key={col.value}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
        >
          <span className={cn("h-2 w-2 rounded-full", col.dotClass)} />
          {col.label}
          <span className="tabular-nums text-slate-500">
            {counts[col.value] ?? 0}
          </span>
        </div>
      ))}
    </div>
  );
}

function ResponsableChip({ person }: { person: IndicateurPerson | null }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700">
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white",
          person
            ? "bg-gradient-to-br from-slate-600 to-slate-800"
            : "bg-slate-300 text-slate-600"
        )}
      >
        {initials(person, "—")}
      </span>
      {personLabel(person)}
    </div>
  );
}

function ItemCard({
  title,
  subtitle,
  dateDebut,
  dateCloture,
  badge,
  responsables,
  accent,
}: {
  title: string;
  subtitle?: string;
  dateDebut: string;
  dateCloture: string | null;
  badge: ReactNode;
  responsables: IndicateurPerson[];
  accent: "amber" | "teal";
}) {
  return (
    <article
      className={cn(
        "rounded-xl border bg-white p-3 shadow-sm transition-shadow hover:shadow-md",
        accent === "amber" ? "border-amber-100/80" : "border-teal-100/80"
      )}
    >
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <h4 className="text-sm font-semibold leading-snug text-slate-900">
          {title}
        </h4>
        {badge}
      </div>
      {subtitle && (
        <p className="mb-2 text-xs font-medium text-slate-500">{subtitle}</p>
      )}
      <p className="mb-2.5 text-[11px] text-slate-400">
        {formatDate(dateDebut)} → {formatDate(dateCloture)}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {responsables.length > 0 ? (
          responsables.map((person) => (
            <ResponsableChip key={person.userId} person={person} />
          ))
        ) : (
          <ResponsableChip person={null} />
        )}
      </div>
    </article>
  );
}

function StatutBoardSection<T>({
  title,
  description,
  icon: Icon,
  columns,
  items,
  getStatut,
  getResponsables,
  getProjectKey,
  renderItem,
  accent,
}: {
  title: string;
  description: string;
  icon: typeof FolderKanban;
  columns: Array<{
    value: string;
    label: string;
    headerClass: string;
    dotClass: string;
  }>;
  items: T[];
  getStatut: (item: T) => string;
  getResponsables: (item: T) => IndicateurPerson[];
  getProjectKey?: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  accent: "amber" | "teal";
}) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const col of columns) map[col.value] = 0;
    for (const item of items) {
      const statut = getStatut(item);
      map[statut] = (map[statut] ?? 0) + 1;
    }
    return map;
  }, [columns, items, getStatut]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm",
            accent === "amber"
              ? "bg-gradient-to-br from-amber-500 to-orange-500"
              : "bg-gradient-to-br from-teal-500 to-cyan-600"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <StatutSummaryBar columns={columns} counts={counts} accent={accent} />

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-500">
          Aucun élément à afficher.
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {columns.map((col) => {
            const columnItems = items.filter(
              (item) => getStatut(item) === col.value
            );
            const groups = groupByResponsable(columnItems, getResponsables);

            return (
              <div
                key={col.value}
                className="flex w-[300px] shrink-0 flex-col rounded-2xl border border-slate-200/80 bg-slate-50/40"
              >
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-t-2xl border-b bg-gradient-to-br px-3 py-2.5",
                    col.headerClass
                  )}
                >
                  <span className={cn("h-2.5 w-2.5 rounded-full", col.dotClass)} />
                  <span className="text-sm font-semibold text-slate-800">
                    {col.label}
                  </span>
                  <Badge
                    variant="outline"
                    className="ml-auto border-slate-200 bg-white/80 text-xs tabular-nums text-slate-600"
                  >
                    {columnItems.length}
                  </Badge>
                </div>

                <div className="flex-1 space-y-3 p-2.5">
                  {columnItems.length === 0 ? (
                    <p className="px-1 py-6 text-center text-xs text-slate-400">
                      Vide
                    </p>
                  ) : (
                    groups.map((group) => {
                      const projectGroups = getProjectKey
                        ? (() => {
                            const byProject = new Map<string, T[]>();
                            for (const item of group.items) {
                              const key = getProjectKey(item);
                              const list = byProject.get(key) ?? [];
                              list.push(item);
                              byProject.set(key, list);
                            }
                            return Array.from(byProject.entries()).sort(
                              ([a], [b]) => a.localeCompare(b, "fr")
                            );
                          })()
                        : null;

                      return (
                        <div
                          key={group.key}
                          className="space-y-2 rounded-xl border border-slate-200/70 bg-white/70 p-2"
                        >
                          <div className="flex items-center gap-2 px-1">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            <ResponsableChip person={group.person} />
                            <span className="ml-auto text-[10px] tabular-nums text-slate-400">
                              {group.items.length}
                            </span>
                          </div>

                          {projectGroups
                            ? projectGroups.map(([projectName, projectItems]) => (
                                <div key={projectName} className="space-y-2">
                                  <div className="flex items-center gap-1.5 px-1">
                                    <FolderKanban className="h-3 w-3 text-slate-400" />
                                    <span className="truncate text-[11px] font-semibold text-slate-600">
                                      {projectName}
                                    </span>
                                  </div>
                                  {projectItems.map(renderItem)}
                                </div>
                              ))
                            : group.items.map(renderItem)}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function IndicateursClient({
  initialData,
  initialError,
}: Props) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(initialError);
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const result = await getCommunicationIndicateurs();
      setData(result.data);
      setError(result.success ? null : result.error);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Communication
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Indicateurs
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Vue d&apos;ensemble des projets ponctuels et des activités de
            routine, organisée par statut, responsable et projet.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="shrink-0 border-slate-200"
        >
          <RefreshCw
            className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")}
          />
          Actualiser
        </Button>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* —— Projets Ponctuels —— */}
      <section className="overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/40 shadow-sm ring-1 ring-amber-100/60">
        <div className="border-b border-amber-100/80 bg-gradient-to-r from-amber-500/10 via-transparent to-orange-500/10 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Projets Ponctuels
              </h2>
              <p className="text-sm text-slate-500">
                Projets et activités ponctuelles par statut et responsable
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-10 px-4 py-6 sm:px-6">
          <StatutBoardSection
            title="Projets"
            description="Tous les ProjetPonctuel selon leur statutProjet et par responsable"
            icon={Layers}
            columns={PROJET_STATUT_COLUMNS}
            items={data.projetsPonctuels}
            getStatut={(item) => item.statutProjet}
            getResponsables={(item) => item.responsables}
            accent="amber"
            renderItem={(item) => {
              const config = PROJET_STATUT_COLUMNS.find(
                (c) => c.value === item.statutProjet
              );
              return (
                <ItemCard
                  key={item.id}
                  title={item.titre}
                  dateDebut={item.dateDebut}
                  dateCloture={item.dateCloture}
                  accent="amber"
                  responsables={item.responsables}
                  badge={
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 border text-[10px]",
                        config?.badgeClass
                      )}
                    >
                      {config?.label ?? item.statutProjet}
                    </Badge>
                  }
                />
              );
            }}
          />

          <div className="border-t border-amber-100/80 pt-8">
            <StatutBoardSection
              title="Activités"
              description="Tous les ProjetPonctuelActivite selon leur statutActivite, par responsable et projet"
              icon={ClipboardList}
              columns={ACTIVITE_STATUT_COLUMNS.map((c) => ({
                value: c.value,
                label: c.label,
                headerClass: c.headerClass,
                dotClass: c.dotClass,
              }))}
              items={data.activitesPonctuelles}
              getStatut={(item) => item.statutActivite}
              getResponsables={(item) => item.responsables}
              getProjectKey={(item) => item.projetTitre}
              accent="amber"
              renderItem={(item) => {
                const config = getActiviteStatutConfig(item.statutActivite);
                return (
                  <ItemCard
                    key={item.id}
                    title={item.titre}
                    subtitle={item.projetTitre}
                    dateDebut={item.dateDebut}
                    dateCloture={item.dateCloture}
                    accent="amber"
                    responsables={item.responsables}
                    badge={
                      <Badge
                        variant="outline"
                        className="shrink-0 border-slate-200 text-[10px] text-slate-600"
                      >
                        {config.label}
                      </Badge>
                    }
                  />
                );
              }}
            />
          </div>
        </div>
      </section>

      {/* —— Projet de Routine —— */}
      <section className="overflow-hidden rounded-3xl border border-teal-200/70 bg-gradient-to-br from-teal-50/80 via-white to-cyan-50/40 shadow-sm ring-1 ring-teal-100/60">
        <div className="border-b border-teal-100/80 bg-gradient-to-r from-teal-500/10 via-transparent to-cyan-500/10 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md">
              <ListChecks className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Projet de Routine
              </h2>
              <p className="text-sm text-slate-500">
                Activités et tâches de routine par statut et responsable
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-10 px-4 py-6 sm:px-6">
          <StatutBoardSection
            title="Activités de routine"
            description="Toutes les ActiviteProjetRoutine selon leur statutActivite et par responsable"
            icon={ClipboardList}
            columns={ACTIVITE_STATUT_COLUMNS.map((c) => ({
              value: c.value,
              label: c.label,
              headerClass: c.headerClass,
              dotClass: c.dotClass,
            }))}
            items={data.activitesRoutine}
            getStatut={(item) => item.statutActivite}
            getResponsables={(item) =>
              item.responsable ? [item.responsable] : []
            }
            accent="teal"
            renderItem={(item) => {
              const config = getActiviteStatutConfig(item.statutActivite);
              return (
                <ItemCard
                  key={item.id}
                  title={item.libelle}
                  subtitle={item.roleMissionLibelle}
                  dateDebut={item.dateDebut}
                  dateCloture={item.dateCloture}
                  accent="teal"
                  responsables={item.responsable ? [item.responsable] : []}
                  badge={
                    <Badge
                      variant="outline"
                      className="shrink-0 border-slate-200 text-[10px] text-slate-600"
                    >
                      {config.label}
                    </Badge>
                  }
                />
              );
            }}
          />

          <div className="border-t border-teal-100/80 pt-8">
            <StatutBoardSection
              title="Tâches de routine"
              description="Toutes les TacheActiviteProjetRoutine selon leur statutTache, par responsable et projet"
              icon={User}
              columns={TACHE_STATUT_COLUMNS.map((c) => ({
                value: c.value,
                label: c.label,
                headerClass: c.headerClass,
                dotClass: c.dotClass,
              }))}
              items={data.tachesRoutine}
              getStatut={(item) => item.statutTache}
              getResponsables={(item) => item.responsables}
              getProjectKey={(item) =>
                `${item.roleMissionLibelle} · ${item.activiteLibelle}`
              }
              accent="teal"
              renderItem={(item) => {
                const config = getTacheStatutConfig(item.statutTache);
                return (
                  <ItemCard
                    key={item.id}
                    title={item.libelle}
                    subtitle={`${item.roleMissionLibelle} · ${item.activiteLibelle}`}
                    dateDebut={item.dateDebut}
                    dateCloture={item.dateCloture}
                    accent="teal"
                    responsables={item.responsables}
                    badge={
                      <Badge
                        variant="outline"
                        className="shrink-0 border-slate-200 text-[10px] text-slate-600"
                      >
                        {config.label}
                      </Badge>
                    }
                  />
                );
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
