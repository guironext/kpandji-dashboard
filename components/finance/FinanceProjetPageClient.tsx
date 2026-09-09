"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  CalendarRange,
  Car,
  CheckCircle2,
  Eye,
  FolderKanban,
  Loader2,
  Pencil,
  Plus,
  Target,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  deleteFinanceProjet,
  validateFinanceProjet,
  type FinanceProjetListItem,
} from "@/lib/actions/finance-projet";
import type { StatutFinanceProjet } from "@/lib/finance-projet-statut";
import FinanceProjetFormDialog from "./FinanceProjetFormDialog";
import FinanceProjetDetailDialog from "./FinanceProjetDetailDialog";

const STATUT_ORDER: StatutFinanceProjet[] = [
  "EN_COURS",
  "BROUILLON",
  "VALIDE",
  "EN_PAUSE",
  "TERMINE",
  "ANNULE",
];

const STATUT_META: Record<
  StatutFinanceProjet,
  { label: string; className: string; bar: string; accent: string }
> = {
  BROUILLON: {
    label: "Brouillon",
    className: "border-slate-200 bg-slate-100 text-slate-700",
    bar: "from-slate-400 to-slate-500",
    accent: "text-slate-700",
  },
  EN_COURS: {
    label: "En cours",
    className: "border-teal-200 bg-teal-50 text-teal-800",
    bar: "from-teal-500 to-emerald-600",
    accent: "text-teal-800",
  },
  EN_PAUSE: {
    label: "En pause",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    bar: "from-amber-500 to-orange-500",
    accent: "text-amber-800",
  },
  VALIDE: {
    label: "Validé",
    className: "border-sky-200 bg-sky-50 text-sky-800",
    bar: "from-sky-500 to-indigo-600",
    accent: "text-sky-800",
  },
  TERMINE: {
    label: "Terminé",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    bar: "from-emerald-500 to-teal-600",
    accent: "text-emerald-800",
  },
  ANNULE: {
    label: "Annulé",
    className: "border-rose-200 bg-rose-50 text-rose-800",
    bar: "from-rose-500 to-rose-600",
    accent: "text-rose-800",
  },
};

function formatFcfa(value: number | null) {
  if (value == null) return "Non défini";
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} FCFA`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return format(new Date(value), "d MMM yyyy", { locale: fr });
}

function personName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`.trim();
}

export default function FinanceProjetPageClient({
  initialProjects,
}: {
  initialProjects: FinanceProjetListItem[];
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<FinanceProjetListItem | null>(
    null
  );
  const [viewingProject, setViewingProject] = useState<FinanceProjetListItem | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const groupedProjects = useMemo(
    () =>
      STATUT_ORDER.map((statut) => ({
        statut,
        meta: STATUT_META[statut],
        items: projects
          .filter((project) => project.statut === statut)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
      })).filter((group) => group.items.length > 0),
    [projects]
  );

  const openCreate = () => {
    setEditingProject(null);
    setDialogOpen(true);
  };

  const openEdit = (project: FinanceProjetListItem) => {
    setEditingProject(project);
    setDialogOpen(true);
  };

  const openView = (project: FinanceProjetListItem) => {
    setViewingProject(project);
  };

  const handleValidate = async (project: FinanceProjetListItem) => {
    if (project.statut === "VALIDE") return;

    setValidatingId(project.id);
    try {
      const result = await validateFinanceProjet(project.id);
      if (result.success) {
        setProjects((prev) =>
          prev.map((item) =>
            item.id === project.id ? { ...item, statut: "VALIDE" } : item
          )
        );
        toast.success("Projet validé.");
      } else {
        toast.error(result.error ?? "Erreur lors de la validation.");
      }
    } catch (error) {
      console.error("validateFinanceProjet:", error);
      toast.error("Erreur lors de la validation du projet.");
    } finally {
      setValidatingId(null);
    }
  };

  const handleDelete = async (project: FinanceProjetListItem) => {
    const confirmed = window.confirm(
      `Supprimer le projet « ${project.nom} » ? Cette action est irréversible.`
    );
    if (!confirmed) return;

    setDeletingId(project.id);
    try {
      const result = await deleteFinanceProjet(project.id);
      if (result.success) {
        setProjects((prev) => prev.filter((item) => item.id !== project.id));
        toast.success("Projet supprimé.");
      } else {
        toast.error(result.error ?? "Erreur lors de la suppression.");
      }
    } catch (error) {
      console.error("deleteFinanceProjet:", error);
      toast.error("Erreur lors de la suppression du projet.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="relative min-h-[calc(100dvh-4rem)] overflow-hidden bg-[#f8fafc]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.08),transparent_28%),linear-gradient(to_bottom,#f8fafc,#ffffff_45%,#f1f5f9)]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mb-5 -ml-2 text-slate-600 hover:text-teal-800"
          >
            <Link href="/finance">
              <ArrowLeft className="h-4 w-4" />
              Tableau de bord
            </Link>
          </Button>

          <div className="mb-8 overflow-hidden rounded-3xl border border-slate-100 bg-white/90 shadow-xl shadow-slate-200/40">
            <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-600" />
            <div className="flex flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-8">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                  <FolderKanban className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Finance
                  </p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                    Projets
                  </h1>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                    Créez et suivez les projets commerciaux du département finance.
                    {projects.length > 0
                      ? ` ${projects.length} projet${projects.length > 1 ? "s" : ""} classé${projects.length > 1 ? "s" : ""} par statut.`
                      : ""}
                  </p>
                </div>
              </div>
              <Button
                onClick={openCreate}
                className="h-11 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-700 px-5 text-white shadow-lg shadow-teal-600/25 hover:from-teal-700 hover:to-emerald-800"
              >
                <Plus className="h-4 w-4" />
                Créer Nouveau Projet
              </Button>
            </div>
          </div>

          {projects.length === 0 ? (
            <Card className="gap-0 overflow-hidden border-0 bg-white/90 py-0 shadow-xl shadow-slate-200/40">
              <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-600" />
              <CardContent className="flex min-h-[320px] flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-700">
                  <FolderKanban className="h-7 w-7" />
                </div>
                <p className="text-lg font-semibold text-slate-900">
                  Aucun projet créé
                </p>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                  Les projets finance s&apos;afficheront ici dès qu&apos;ils seront
                  enregistrés.
                </p>
                <Button
                  onClick={openCreate}
                  className="mt-6 rounded-xl bg-teal-700 hover:bg-teal-800"
                >
                  <Plus className="h-4 w-4" />
                  Créer Nouveau Projet
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {groupedProjects.map((group) => (
                <section key={group.statut} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full bg-gradient-to-br",
                        group.meta.bar
                      )}
                    />
                    <h2 className={cn("text-sm font-bold uppercase tracking-[0.14em]", group.meta.accent)}>
                      {group.meta.label}
                    </h2>
                    <Badge className={cn("rounded-full", group.meta.className)}>
                      {group.items.length}
                    </Badge>
                    <div className="h-px flex-1 bg-slate-200/80" />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((project) => {
                      const statut = STATUT_META[project.statut];
                      const isDeleting = deletingId === project.id;
                      const isValidating = validatingId === project.id;
                      const isValidated = project.statut === "VALIDE";
                      const isBusy = isDeleting || isValidating;
                      return (
                        <article
                          key={project.id}
                          className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/40 ring-1 ring-slate-100/80 transition hover:-translate-y-0.5 hover:shadow-xl"
                        >
                          <div
                            className={cn(
                              "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
                              statut.bar
                            )}
                          />
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <h3 className="text-base font-semibold tracking-tight text-slate-900">
                              {project.nom}
                            </h3>
                            <Badge className={cn("rounded-full", statut.className)}>
                              {statut.label}
                            </Badge>
                          </div>
                          <p className="mb-4 line-clamp-2 min-h-10 text-sm leading-relaxed text-slate-500">
                            {project.description || "Aucune description"}
                          </p>
                          <div className="space-y-2 text-sm text-slate-600">
                            <p className="flex items-center gap-2">
                              <CalendarRange className="h-4 w-4 text-teal-700" />
                              {formatDate(project.dateDebut)}
                              {project.dateFin ? ` → ${formatDate(project.dateFin)}` : ""}
                            </p>
                            <p className="flex items-center gap-2">
                              <Wallet className="h-4 w-4 text-amber-600" />
                              {formatFcfa(project.objectifVolumeAffaire)}
                            </p>
                            <p className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-slate-500" />
                              {project.responsables.length > 0
                                ? project.responsables.map(personName).join(", ")
                                : `Créé par ${personName(project.createdBy)}`}
                            </p>
                            <p className="flex items-center gap-2">
                              <Car className="h-4 w-4 text-slate-500" />
                              {project.modelesCibles.length > 0
                                ? project.modelesCibles.map((m) => m.model).join(", ")
                                : "Aucun modèle ciblé"}
                            </p>
                            <p className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-slate-500" />
                              {project.objectifsCount} objectif
                              {project.objectifsCount !== 1 ? "s" : ""}
                            </p>
                          </div>

                          <div className="mt-auto space-y-3 border-t border-slate-100 pt-4">
                            <Button
                              type="button"
                              className={cn(
                                "h-10 w-full rounded-xl text-sm font-semibold shadow-sm",
                                isValidated
                                  ? "bg-sky-50 text-sky-800 ring-1 ring-sky-200 hover:bg-sky-50"
                                  : "bg-gradient-to-r from-sky-600 to-indigo-700 text-white shadow-sky-600/20 hover:from-sky-700 hover:to-indigo-800"
                              )}
                              onClick={() => handleValidate(project)}
                              disabled={isBusy || isValidated}
                            >
                              {isValidating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                              {isValidated ? "Projet validé" : "Valider le projet"}
                            </Button>
                            <div className="flex items-center justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-10 rounded-xl border-sky-200 text-sky-700 hover:bg-sky-50 hover:text-sky-800"
                                  onClick={() => openView(project)}
                                  disabled={isBusy}
                                  aria-label={`Voir ${project.nom}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Voir</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-10 rounded-xl border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                                  onClick={() => openEdit(project)}
                                  disabled={isBusy}
                                  aria-label={`Modifier ${project.nom}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Modifier</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-10 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                  onClick={() => handleDelete(project)}
                                  disabled={isBusy}
                                  aria-label={`Supprimer ${project.nom}`}
                                >
                                  {isDeleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Supprimer</TooltipContent>
                            </Tooltip>
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

        <FinanceProjetFormDialog
          open={dialogOpen}
          project={editingProject}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingProject(null);
          }}
          onSuccess={(project) =>
            setProjects((prev) => {
              const exists = prev.some((item) => item.id === project.id);
              if (exists) {
                return prev.map((item) => (item.id === project.id ? project : item));
              }
              return [project, ...prev];
            })
          }
        />
        <FinanceProjetDetailDialog
          open={Boolean(viewingProject)}
          project={viewingProject}
          onOpenChange={(open) => {
            if (!open) setViewingProject(null);
          }}
        />
      </div>
    </TooltipProvider>
  );
}
