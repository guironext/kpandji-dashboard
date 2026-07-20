"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ClipboardList, FolderKanban, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ProjetProgressionItem } from "@/lib/actions/projet-ponctuel-performance";

type Props = {
  progression: ProjetProgressionItem[];
};

const PROJET_STATUT_BADGE: Record<
  ProjetProgressionItem["statutProjet"],
  string
> = {
  EN_ATTENTE: "bg-slate-100 text-slate-700",
  EN_COURS: "bg-sky-100 text-sky-800",
  TERMINEE: "bg-emerald-100 text-emerald-800",
  ANNULE: "bg-rose-100 text-rose-700",
};

function ProgressRow({
  label,
  sublabel,
  progress,
  barClass,
  size = "md",
}: {
  label: string;
  sublabel?: string;
  progress: number;
  barClass?: string;
  size?: "md" | "sm";
}) {
  return (
    <div className={cn("space-y-1.5", size === "sm" && "space-y-1")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              "font-medium text-slate-900",
              size === "sm" ? "text-sm" : "text-base"
            )}
          >
            {label}
          </p>
          {sublabel && (
            <p className="text-xs text-slate-500">{sublabel}</p>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 font-bold tabular-nums text-slate-700",
            size === "sm" ? "text-xs" : "text-sm"
          )}
        >
          {progress}%
        </span>
      </div>
      <div
        className={cn(
          "overflow-hidden rounded-full bg-slate-100",
          size === "sm" ? "h-1.5" : "h-2.5"
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            barClass ?? "bg-gradient-to-r from-amber-500 to-orange-500"
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

function ProjetProgressionCard({
  project,
  defaultOpen,
}: {
  project: ProjetProgressionItem;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-100">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start gap-3 border-b border-slate-100 bg-gradient-to-r from-amber-50/50 via-white to-orange-50/30 px-4 py-4 text-left transition-colors hover:bg-amber-50/40 sm:px-5"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm">
          <FolderKanban className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">{project.titre}</h3>
            <Badge
              className={cn(
                "border-0 hover:bg-inherit",
                PROJET_STATUT_BADGE[project.statutProjet]
              )}
            >
              {project.statutLabel}
            </Badge>
            <Badge variant="outline" className="border-slate-200 text-slate-600">
              {project.completedCount}/{project.totalCount} activité
              {project.totalCount !== 1 ? "s" : ""} terminée
              {project.completedCount !== 1 ? "s" : ""}
            </Badge>
          </div>
          <ProgressRow
            label="Progression du projet"
            progress={project.progress}
            barClass="bg-gradient-to-r from-amber-500 to-orange-500"
          />
        </div>
        <ChevronDown
          className={cn(
            "mt-1 h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="space-y-3 px-4 py-4 sm:px-5">
          {project.activites.length > 0 ? (
            project.activites.map((activite) => (
              <div
                key={activite.id}
                className="rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-semibold text-slate-800">
                    {activite.titre}
                  </span>
                  <Badge variant="outline" className="border-slate-200 text-[11px] text-slate-600">
                    {activite.statutLabel}
                  </Badge>
                </div>
                <ProgressRow
                  label="Progression de l'activité"
                  progress={activite.progress}
                  barClass={activite.barClass}
                  size="sm"
                />
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
              Aucune activité définie pour ce projet.
            </p>
          )}
        </div>
      )}
    </article>
  );
}

export default function ProjetProgressionSection({ progression }: Props) {
  const summary = useMemo(() => {
    const totalProjects = progression.length;
    const totalActivites = progression.reduce((sum, p) => sum + p.totalCount, 0);
    const completedActivites = progression.reduce((sum, p) => sum + p.completedCount, 0);
    const globalProgress =
      totalActivites > 0
        ? Math.round(
            progression.reduce(
              (sum, project) => sum + project.progress * project.totalCount,
              0
            ) / totalActivites
          )
        : 0;

    return { totalProjects, totalActivites, completedActivites, globalProgress };
  }, [progression]);

  if (progression.length === 0) {
    return (
      <section className="overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/40 to-orange-50/20 shadow-sm ring-1 ring-amber-100/60">
        <div className="border-b border-amber-100/80 bg-gradient-to-r from-amber-50/80 to-white px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900">
              Progression des projets et activités
            </h3>
          </div>
        </div>
        <p className="px-4 py-10 text-center text-sm text-slate-500 sm:px-5">
          Aucun projet disponible pour afficher la progression.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-amber-200/60 bg-white shadow-sm ring-1 ring-amber-100/60">
      <div className="border-b border-amber-100/80 bg-gradient-to-r from-amber-50/80 via-white to-orange-50/40 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">
                Progression des projets et activités
              </h3>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Avancement global basé sur le statut de chaque activité
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-xl border border-amber-100 bg-white/80 px-3 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Projets
              </p>
              <p className="text-lg font-bold tabular-nums text-slate-900">
                {summary.totalProjects}
              </p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-white/80 px-3 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Activités
              </p>
              <p className="text-lg font-bold tabular-nums text-slate-900">
                {summary.completedActivites}/{summary.totalActivites}
              </p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-white/80 px-3 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Global
              </p>
              <p className="text-lg font-bold tabular-nums text-amber-700">
                {summary.globalProgress}%
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <ProgressRow
            label="Progression globale"
            sublabel="Moyenne pondérée de tous les projets affichés"
            progress={summary.globalProgress}
            barClass="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500"
          />
        </div>
      </div>

      <div className="space-y-3 bg-gradient-to-b from-white to-slate-50/40 p-4 sm:p-5">
        {progression.map((project, index) => (
          <ProjetProgressionCard
            key={project.id}
            project={project}
            defaultOpen={index === 0 || progression.length === 1}
          />
        ))}
      </div>
    </section>
  );
}
