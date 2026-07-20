"use client";

import { useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowRight,
  Calendar,
  Clock3,
  FolderKanban,
  Plus,
  Search,
  Sparkles,
  User,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ProjetPonctuelListItem } from "@/lib/actions/projet-ponctuel";
import ProjetPonctuelFormDialog from "./ProjetPonctuelFormDialog";

const STATUT_LABELS: Record<ProjetPonctuelListItem["statutProjet"], string> = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ANNULE: "Annulée",
};

const STATUT_STYLES: Record<
  ProjetPonctuelListItem["statutProjet"],
  { badge: string; accent: string; dot: string }
> = {
  EN_ATTENTE: {
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    accent: "from-slate-400 to-slate-500",
    dot: "bg-slate-400",
  },
  EN_COURS: {
    badge: "bg-sky-100 text-sky-800 border-sky-200",
    accent: "from-sky-500 to-cyan-500",
    dot: "bg-sky-500",
  },
  TERMINEE: {
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    accent: "from-emerald-500 to-teal-500",
    dot: "bg-emerald-500",
  },
  ANNULE: {
    badge: "bg-rose-100 text-rose-800 border-rose-200",
    accent: "from-rose-500 to-pink-500",
    dot: "bg-rose-500",
  },
};

const FILTER_OPTIONS: Array<{
  value: "all" | ProjetPonctuelListItem["statutProjet"];
  label: string;
}> = [
  { value: "all", label: "Tous" },
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "EN_COURS", label: "En cours" },
  { value: "TERMINEE", label: "Terminés" },
  { value: "ANNULE", label: "Annulés" },
];

type Props = {
  initialProjects: ProjetPonctuelListItem[];
  onProjectCreated?: (project: ProjetPonctuelListItem) => void;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return format(new Date(value), "d MMM yyyy", { locale: fr });
}

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "violet" | "sky" | "emerald" | "slate";
}) {
  const tones = {
    violet: "from-violet-500/10 to-fuchsia-500/5 border-violet-200/70 text-violet-700",
    sky: "from-sky-500/10 to-cyan-500/5 border-sky-200/70 text-sky-700",
    emerald: "from-emerald-500/10 to-teal-500/5 border-emerald-200/70 text-emerald-700",
    slate: "from-slate-500/10 to-slate-400/5 border-slate-200/70 text-slate-700",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-gradient-to-br px-4 py-3.5 shadow-sm ring-1 ring-white/60",
        tones[tone]
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

function ProjectCard({ project }: { project: ProjetPonctuelListItem }) {
  const styles = STATUT_STYLES[project.statutProjet];
  const createdAgo = formatDistanceToNow(new Date(project.createdAt), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200/80 hover:shadow-lg hover:shadow-violet-100/50">
      <div
        className={cn("absolute inset-y-0 left-0 w-1 bg-gradient-to-b", styles.accent)}
        aria-hidden
      />

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", styles.dot)} />
              <Badge variant="outline" className={cn("text-[11px]", styles.badge)}>
                {STATUT_LABELS[project.statutProjet]}
              </Badge>
            </div>
            <h3 className="line-clamp-2 text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-violet-900 sm:text-lg">
              {project.titre}
            </h3>
          </div>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white shadow-md",
              styles.accent
            )}
            title={`${project.user.firstName} ${project.user.lastName}`}
          >
            {initials(project.user.firstName, project.user.lastName)}
          </div>
        </div>

        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
          {project.description}
        </p>

        <div className="mt-4 grid gap-2.5 border-t border-slate-100 pt-4 text-sm">
          <div className="flex items-center gap-2.5 text-slate-600">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Période
              </p>
              <p className="truncate font-medium text-slate-700">
                {formatDate(project.dateDebut)}
                {project.dateCloture ? ` → ${formatDate(project.dateCloture)}` : " → En cours"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-600">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Créé par
              </p>
              <p className="truncate font-medium text-slate-700">
                {project.user.firstName} {project.user.lastName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-500">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
              <Clock3 className="h-4 w-4" />
            </div>
            <p className="text-xs">{createdAgo}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function GenererProjetPanel({ initialProjects, onProjectCreated }: Props) {
  const [projects, setProjects] = useState(initialProjects);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | ProjetPonctuelListItem["statutProjet"]
  >("all");

  const stats = useMemo(
    () => ({
      total: projects.length,
      enCours: projects.filter((p) => p.statutProjet === "EN_COURS").length,
      enAttente: projects.filter((p) => p.statutProjet === "EN_ATTENTE").length,
      termines: projects.filter((p) => p.statutProjet === "TERMINEE").length,
    }),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesStatus = statusFilter === "all" || project.statutProjet === statusFilter;
      if (!matchesStatus) return false;
      if (!query) return true;
      return (
        project.titre.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        `${project.user.firstName} ${project.user.lastName}`.toLowerCase().includes(query)
      );
    });
  }, [projects, search, statusFilter]);

  return (
    <div className={cn("relative px-4 py-5 sm:px-6 sm:py-6", projects.length > 0 && "pb-24 sm:pb-6")}>
      <div
        className="pointer-events-none absolute -right-8 top-0 h-40 w-40 rounded-full bg-violet-200/30 blur-3xl"
        aria-hidden
      />

      <div className="relative mb-6 overflow-hidden rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50/90 via-white to-fuchsia-50/50 p-4 shadow-sm ring-1 ring-violet-100/80 sm:p-5">
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-300/20 blur-2xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 sm:h-12 sm:w-12">
              <Wand2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Badge className="border-0 bg-violet-100 text-violet-700 hover:bg-violet-100">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Génération
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
                Vos projets ponctuels
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Créez et gérez vos projets ponctuels. Chaque projet pourra ensuite recevoir
                des activités, des responsables et un suivi de performance.
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="lg"
            onClick={() => setDialogOpen(true)}
            className="h-11 w-full shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 text-white shadow-lg shadow-violet-500/25 transition hover:from-violet-700 hover:to-fuchsia-700 hover:shadow-violet-500/35 sm:w-auto"
          >
            <Plus className="mr-2 h-5 w-5" />
            Créer Projet
          </Button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total" value={stats.total} tone="violet" />
        <StatCard label="En cours" value={stats.enCours} tone="sky" />
        <StatCard label="En attente" value={stats.enAttente} tone="slate" />
        <StatCard label="Terminés" value={stats.termines} tone="emerald" />
      </div>

      {projects.length > 0 && (
        <div className="mb-5 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un projet, une description ou un auteur..."
              className="h-11 rounded-xl border-slate-200/90 bg-white pl-10 shadow-sm focus-visible:ring-violet-500/25"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTER_OPTIONS.map((option) => {
              const active = statusFilter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition-all",
                    active
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/20"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl border border-dashed border-violet-200/90 bg-gradient-to-br from-violet-50/70 via-white to-fuchsia-50/40 px-6 py-16 text-center sm:py-20">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.08),transparent_55%)]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-md">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-xl shadow-violet-500/30">
              <FolderKanban className="h-8 w-8" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Aucun projet ponctuel</h4>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Lancez votre premier projet ponctuel en quelques clics. Définissez le titre,
              la description et le calendrier — le reste viendra ensuite.
            </p>
            <Button
              type="button"
              size="lg"
              onClick={() => setDialogOpen(true)}
              className="mt-6 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-fuchsia-700"
            >
              <Plus className="mr-2 h-5 w-5" />
              Créer Projet
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center">
          <p className="text-base font-semibold text-slate-800">Aucun résultat</p>
          <p className="mt-1 text-sm text-slate-500">
            Aucun projet ne correspond à votre recherche ou au filtre sélectionné.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 rounded-xl"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
          >
            Réinitialiser les filtres
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {projects.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 p-4 sm:hidden">
          <div className="pointer-events-auto mx-auto max-w-md">
            <Button
              type="button"
              size="lg"
              onClick={() => setDialogOpen(true)}
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-2xl shadow-violet-500/35"
            >
              <Plus className="mr-2 h-5 w-5" />
              Créer Projet
            </Button>
          </div>
        </div>
      )}

      <ProjetPonctuelFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={(project) => {
          setProjects((prev) => [project, ...prev]);
          onProjectCreated?.(project);
        }}
      />
    </div>
  );
}
