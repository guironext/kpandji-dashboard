"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import {
  buildRapportProjetWordBlob,
  getRapportWordFileName,
} from "@/lib/export-communication-rapport-word";
import {
  getCommunicationProjectById,
  setProjectStatusInactive,
  type CommunicationProjectDetail,
  type CommunicationProjectListItem,
} from "@/lib/actions/communication-project";
import {
  getPlanActionsWithActorsByProjectId,
  type PlanActionWithActors,
} from "@/lib/actions/communication-plan-action";
import {
  getMiseEnOeuvreDataByProjectId,
  type MiseEnOeuvreActorGroup,
} from "@/lib/actions/communication-mise-en-oeuvre";
import { getTaskStageConfig } from "@/lib/plan-action-task-stage";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileDown,
  FileText,
  Flag,
  FolderKanban,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  ProjectDetailSection,
  StatCard,
} from "../resume-projet/resume-projet-ui";

type Props = {
  projects: CommunicationProjectListItem[];
};

function formatDate(date: Date | string): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "dd MMM yyyy", { locale: fr });
  } catch {
    return String(date);
  }
}

function formatDateTime(date: Date | string): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "dd MMM yyyy · HH:mm", { locale: fr });
  } catch {
    return String(date);
  }
}

function countTasks(groups: MiseEnOeuvreActorGroup[]): number {
  return groups.reduce(
    (n, g) => n + g.actions.reduce((a, act) => a + act.tasks.length, 0),
    0
  );
}

function ProjectResume({ project }: { project: CommunicationProjectDetail }) {
  const hasAnyDetail =
    project.diagnosticContext ||
    project.diagnosticTarget ||
    project.diagnosticEnvironment ||
    project.diagnosticForces ||
    project.objectives ||
    project.strategyPositioning ||
    project.strategyTargets ||
    project.strategyChannels ||
    project.actionPlan ||
    project.actionSupports ||
    project.actionCalendar ||
    project.actionBudget ||
    project.implementationContent ||
    project.implementationLaunch ||
    project.implementationTeams ||
    project.evaluationMetrics ||
    project.evaluationComparison ||
    project.evaluationAdjustments;

  return (
    <Card className="overflow-hidden border-slate-200/80 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/60 px-4 py-4 sm:px-6">
        <CardTitle className="flex flex-wrap items-center gap-3 text-base sm:text-lg">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-white sm:h-10 sm:w-10">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <span className="min-w-0 flex-1">Résumé du projet</span>
        </CardTitle>
        <CardDescription className="text-sm">
          Synthèse des informations renseignées pour ce projet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">{project.name}</p>
              <p className="mt-0.5 text-sm text-slate-600">
                Créé le {formatDate(project.createdAt)}
                {project.createdBy
                  ? ` · ${project.createdBy.firstName} ${project.createdBy.lastName}`
                  : ""}
              </p>
            </div>
          </div>
          <Badge
            className={cn(
              "w-fit shrink-0",
              project.projectStatus === "ACTIVE"
                ? "bg-emerald-600 hover:bg-emerald-600"
                : "bg-slate-500 hover:bg-slate-500"
            )}
          >
            {project.projectStatus === "ACTIVE" ? "Actif" : "Terminé"}
          </Badge>
        </div>

        {!hasAnyDetail ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <FileText className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-muted-foreground">
              Aucun détail renseigné pour ce projet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <ProjectDetailSection
              title="1. Diagnostic"
              icon={Target}
              borderClass="border-blue-500"
              iconClass="bg-blue-600"
              defaultOpen
              fields={[
                { label: "Contexte", value: project.diagnosticContext },
                { label: "Cible", value: project.diagnosticTarget },
                { label: "Environnement", value: project.diagnosticEnvironment },
                { label: "Forces / faiblesses", value: project.diagnosticForces },
              ]}
            />
            <ProjectDetailSection
              title="2. Objectifs (SMART)"
              icon={CheckCircle2}
              borderClass="border-emerald-500"
              iconClass="bg-emerald-600"
              fields={[{ label: "Objectifs", value: project.objectives }]}
            />
            <ProjectDetailSection
              title="3. Stratégie"
              icon={TrendingUp}
              borderClass="border-violet-500"
              iconClass="bg-violet-600"
              fields={[
                { label: "Positionnement", value: project.strategyPositioning },
                { label: "Cibles prioritaires", value: project.strategyTargets },
                { label: "Canaux", value: project.strategyChannels },
              ]}
            />
            <ProjectDetailSection
              title="4. Plan d'action (cadre)"
              icon={Calendar}
              borderClass="border-orange-500"
              iconClass="bg-orange-600"
              fields={[
                { label: "Actions", value: project.actionPlan },
                { label: "Supports", value: project.actionSupports },
                { label: "Calendrier", value: project.actionCalendar },
                { label: "Budget", value: project.actionBudget },
              ]}
            />
            <ProjectDetailSection
              title="5. Mise en œuvre"
              icon={Sparkles}
              borderClass="border-indigo-500"
              iconClass="bg-indigo-600"
              fields={[
                { label: "Création des contenus", value: project.implementationContent },
                { label: "Lancement", value: project.implementationLaunch },
                { label: "Coordination des équipes", value: project.implementationTeams },
              ]}
            />
            <ProjectDetailSection
              title="6. Évaluation"
              icon={TrendingUp}
              borderClass="border-teal-500"
              iconClass="bg-teal-600"
              fields={[
                { label: "Mesure d'efficacité", value: project.evaluationMetrics },
                { label: "Comparaison avec objectifs", value: project.evaluationComparison },
                { label: "Ajustements", value: project.evaluationAdjustments },
              ]}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlanActionCard({ action }: { action: PlanActionWithActors }) {
  return (
    <article className="rounded-2xl border border-amber-100/80 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 flex-1 font-semibold text-slate-900">{action.title}</p>
        <Badge
          className={cn(
            "shrink-0",
            action.completed
              ? "bg-emerald-600 hover:bg-emerald-600"
              : "bg-slate-500 hover:bg-slate-500"
          )}
        >
          {action.completed ? "Réalisée" : "En cours"}
        </Badge>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {formatDateTime(action.startDate)}
        <span className="mx-1.5 text-slate-300">→</span>
        {formatDateTime(action.endDate)}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {action.assignedActors.length === 0 ? (
          <span className="text-xs italic text-muted-foreground">Aucun acteur assigné</span>
        ) : (
          action.assignedActors.map(({ actor }) => (
            <Badge key={actor.id} variant="outline" className="font-normal">
              <Users className="mr-1 h-3 w-3" />
              {actor.name}
            </Badge>
          ))
        )}
      </div>
    </article>
  );
}

function PlanActionsSection({ actions }: { actions: PlanActionWithActors[] }) {
  if (actions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <Calendar className="h-9 w-9 text-amber-200" />
        <p className="text-sm font-medium text-muted-foreground">
          Aucune action du plan d&apos;action pour ce projet.
        </p>
      </div>
    );
  }

  const completed = actions.filter((a) => a.completed).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-amber-50/80 px-3 py-2 text-sm text-amber-900">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-600" />
        <span>
          <strong>{completed}</strong> sur <strong>{actions.length}</strong> action
          {actions.length > 1 ? "s" : ""} réalisée{completed > 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid gap-3 md:hidden">
        {actions.map((action) => (
          <PlanActionCard key={action.id} action={action} />
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-amber-100/60 md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-amber-50/80 hover:bg-amber-50/80">
              <TableHead>Action</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Acteurs assignés</TableHead>
              <TableHead className="w-28 text-right">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actions.map((action) => (
              <TableRow key={action.id} className="hover:bg-amber-50/30">
                <TableCell className="max-w-[200px] font-medium lg:max-w-none">
                  {action.title}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-slate-600">
                  <span className="block">{formatDateTime(action.startDate)}</span>
                  <span className="text-slate-400">→ {formatDateTime(action.endDate)}</span>
                </TableCell>
                <TableCell>
                  {action.assignedActors.length === 0 ? (
                    <span className="text-sm italic text-muted-foreground">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {action.assignedActors.map(({ actor }) => (
                        <Badge key={actor.id} variant="outline" className="font-normal">
                          {actor.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    className={cn(
                      action.completed
                        ? "bg-emerald-600 hover:bg-emerald-600"
                        : "bg-slate-500 hover:bg-slate-500"
                    )}
                  >
                    {action.completed ? "Réalisée" : "En cours"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ActorTasksSection({ groups }: { groups: MiseEnOeuvreActorGroup[] }) {
  const withTasks = groups.filter((g) =>
    g.actions.some((a) => a.tasks.length > 0)
  );

  if (withTasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <ClipboardList className="h-9 w-9 text-violet-200" />
        <p className="text-sm font-medium text-muted-foreground">
          Aucune tâche enregistrée pour les acteurs de ce projet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 lg:gap-5">
      {withTasks.map(({ actor, actions }) => {
        const taskCount = actions.reduce((n, a) => n + a.tasks.length, 0);
        return (
          <div
            key={actor.id}
            className="flex flex-col rounded-2xl border border-violet-100 bg-gradient-to-b from-violet-50/50 to-white p-4 shadow-sm sm:p-5"
          >
            <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-violet-100/80 pb-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-bold text-white shadow-md shadow-violet-500/25">
                {actor.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{actor.name}</p>
                <p className="text-xs text-slate-600 sm:text-sm">
                  {actor.department} · {actor.job}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {taskCount} tâche{taskCount > 1 ? "s" : ""}
              </Badge>
            </div>

            <div className="space-y-3">
              {actions
                .filter((a) => a.tasks.length > 0)
                .map((action) => (
                  <div
                    key={action.id}
                    className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm sm:p-4"
                  >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-700/90">
                      {action.title}
                    </p>
                    <ul className="space-y-2">
                      {action.tasks.map((task) => {
                        const stage = getTaskStageConfig(task.stage);
                        return (
                          <li
                            key={task.id}
                            className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50/80"
                          >
                            <div className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <p className="font-medium text-slate-900">{task.title}</p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {formatDate(task.startDate)} → {formatDate(task.endDate)}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn("w-fit shrink-0 text-[10px]", stage.badgeClass)}
                              >
                                {stage.label}
                              </Badge>
                            </div>
                            <span
                              className={cn("block h-1", stage.swatchClass)}
                              aria-hidden
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function RapportProjetsClient({ projects }: Props) {
  const router = useRouter();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects[0]?.id ?? null
  );
  const [project, setProject] = useState<CommunicationProjectDetail | null>(null);
  const [planActions, setPlanActions] = useState<PlanActionWithActors[]>([]);
  const [actorGroups, setActorGroups] = useState<MiseEnOeuvreActorGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const selectedListItem = projects.find((p) => p.id === selectedProjectId);
  const isActive = selectedListItem?.projectStatus === "ACTIVE";

  const totalTasks = useMemo(() => countTasks(actorGroups), [actorGroups]);
  const completedActions = useMemo(
    () => planActions.filter((a) => a.completed).length,
    [planActions]
  );

  const loadProjectData = useCallback(async (projectId: string) => {
    setLoading(true);
    try {
      const [projectRes, planRes, miseRes] = await Promise.all([
        getCommunicationProjectById(projectId),
        getPlanActionsWithActorsByProjectId(projectId),
        getMiseEnOeuvreDataByProjectId(projectId),
      ]);

      if (projectRes.success && projectRes.project) {
        setProject(projectRes.project);
      } else {
        setProject(null);
      }

      if (planRes.success) {
        setPlanActions(planRes.actions);
      } else {
        setPlanActions([]);
      }

      if (miseRes.success && miseRes.data) {
        setActorGroups(miseRes.data.byActor);
      } else {
        setActorGroups([]);
      }
    } catch (error) {
      console.error("Error loading rapport projet:", error);
      toast.error("Erreur lors du chargement des données du projet");
      setProject(null);
      setPlanActions([]);
      setActorGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setProject(null);
      setPlanActions([]);
      setActorGroups([]);
      return;
    }
    void loadProjectData(selectedProjectId);
  }, [selectedProjectId, loadProjectData]);

  const handleExportToWord = async () => {
    if (!project) {
      toast.error("Aucun projet sélectionné");
      return;
    }

    setExporting(true);
    try {
      const blob = await buildRapportProjetWordBlob({
        project,
        planActions,
        actorGroups,
      });
      saveAs(blob, getRapportWordFileName(project.name));
      toast.success("Document Word exporté avec succès");
    } catch (error) {
      console.error("Export to Word error:", error);
      toast.error("Erreur lors de l'exportation du document Word");
    } finally {
      setExporting(false);
    }
  };

  const handleFinProjet = async () => {
    if (!selectedProjectId || !project) return;
    if (project.projectStatus !== "ACTIVE") {
      toast.info("Ce projet est déjà terminé (inactif).");
      return;
    }

    setFinishing(true);
    try {
      const result = await setProjectStatusInactive(selectedProjectId);
      if (result.success) {
        toast.success(`Le projet « ${project.name} » est marqué comme terminé.`);
        setProject((prev) => (prev ? { ...prev, projectStatus: "INACTIVE" } : null));
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la clôture du projet");
      }
    } catch (error) {
      console.error("handleFinProjet error:", error);
      toast.error("Erreur lors de la clôture du projet");
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className="min-h-full -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
      <section className="relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-amber-600 via-orange-600 to-rose-700 px-4 pb-8 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_45%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm ring-1 ring-white/20">
                <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                Communication
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Rapport des projets
              </h1>
              <p className="max-w-2xl text-sm text-white/90 sm:text-base">
                Consultez la synthèse complète d&apos;un projet, suivez les actions et les tâches,
                puis clôturez le projet lorsqu&apos;il est terminé.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-xl lg:shrink-0">
              {[
                { label: "Projets", value: String(projects.length) },
                { label: "Actions", value: loading ? "—" : String(planActions.length) },
                {
                  label: "Réalisées",
                  value: loading ? "—" : String(completedActions),
                },
                { label: "Tâches", value: loading ? "—" : String(totalTasks) },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-white/10 px-3 py-2.5 backdrop-blur-sm ring-1 ring-white/20 sm:px-4 sm:py-3"
                >
                  <p className="text-[10px] font-medium text-amber-100/80 sm:text-xs">
                    {stat.label}
                  </p>
                  <p className="mt-0.5 text-xl font-bold text-white sm:text-2xl">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-0">
        {projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <FolderKanban className="h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-600">
                Aucun projet de communication pour le moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
            <Card className="h-fit border-slate-200/80 shadow-sm lg:sticky lg:top-6">
              <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50/80 to-orange-50/50 pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderKanban className="h-4 w-4 text-amber-600" />
                  Projets
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Sélectionnez un projet pour afficher son rapport
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <Select
                  value={selectedProjectId ?? undefined}
                  onValueChange={(id) => setSelectedProjectId(id)}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Choisir un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {p.projectStatus === "INACTIVE" ? " (terminé)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <ul className="max-h-[min(40vh,360px)] space-y-1 overflow-y-auto pr-1">
                  {projects.map((p) => {
                    const active = p.id === selectedProjectId;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedProjectId(p.id)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition",
                            active
                              ? "bg-gradient-to-r from-amber-500 to-orange-600 font-medium text-white shadow-md shadow-amber-500/25"
                              : "text-slate-700 hover:bg-slate-100"
                          )}
                        >
                          <Target
                            className={cn(
                              "h-4 w-4 shrink-0",
                              active ? "text-white" : "text-amber-600"
                            )}
                          />
                          <span className="min-w-0 flex-1 truncate">{p.name}</span>
                          {p.projectStatus === "INACTIVE" && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "shrink-0 text-[10px]",
                                active && "bg-white/20 text-white"
                              )}
                            >
                              Terminé
                            </Badge>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <Button
                    onClick={handleFinProjet}
                    disabled={finishing || !selectedProjectId || !isActive || loading}
                    size="lg"
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 shadow-md shadow-amber-500/20 hover:from-amber-700 hover:to-orange-700"
                  >
                    {finishing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Clôture...
                      </>
                    ) : (
                      <>
                        <Flag className="mr-2 h-5 w-5" />
                        Fin Projet
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleExportToWord}
                    disabled={exporting || !project || loading}
                    size="lg"
                    variant="outline"
                    className="w-full border-amber-200 bg-white hover:bg-amber-50"
                  >
                    {exporting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Export...
                      </>
                    ) : (
                      <>
                        <FileDown className="mr-2 h-5 w-5" />
                        Export to Word
                      </>
                    )}
                  </Button>
                  {!isActive && selectedListItem && (
                    <p className="text-center text-xs text-muted-foreground">
                      Ce projet est déjà terminé.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="min-w-0 space-y-6">
              {loading ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-amber-200/80 bg-amber-50/30">
                  <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
                  <p className="text-sm font-medium text-slate-600">
                    Chargement du rapport...
                  </p>
                </div>
              ) : !project ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                    <FileText className="h-10 w-10 text-slate-300" />
                    <p className="text-sm text-muted-foreground">
                      Sélectionnez un projet pour afficher son rapport.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {selectedListItem && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border-0 bg-amber-100 text-amber-900">
                        <Target className="mr-1 h-3 w-3" />
                        {selectedListItem.name}
                      </Badge>
                      {project.projectStatus === "INACTIVE" && (
                        <Badge variant="secondary">Projet terminé</Badge>
                      )}
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <StatCard
                      label="Actions planifiées"
                      value={String(planActions.length)}
                      icon={Calendar}
                      iconClassName="bg-orange-100 text-orange-600"
                    />
                    <StatCard
                      label="Actions réalisées"
                      value={String(completedActions)}
                      icon={CheckCircle2}
                      iconClassName="bg-emerald-100 text-emerald-600"
                    />
                    <StatCard
                      label="Tâches acteurs"
                      value={String(totalTasks)}
                      icon={ClipboardList}
                      iconClassName="bg-violet-100 text-violet-600"
                    />
                  </div>

                  <ProjectResume project={project} />

                  <Card className="overflow-hidden border-slate-200/80 shadow-sm">
                    <CardHeader className="border-b border-amber-50 bg-gradient-to-r from-amber-50 to-orange-50/60 px-4 py-4 sm:px-6">
                      <CardTitle className="flex flex-wrap items-center gap-3 text-base sm:text-lg">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white sm:h-10 sm:w-10">
                          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <span className="min-w-0 flex-1">Plan d&apos;action</span>
                        {planActions.length > 0 && (
                          <Badge variant="secondary" className="font-normal">
                            {planActions.length}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Actions planifiées et acteurs assignés pour ce projet
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <PlanActionsSection actions={planActions} />
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden border-slate-200/80 shadow-sm">
                    <CardHeader className="border-b border-violet-50 bg-gradient-to-r from-violet-50 to-purple-50/60 px-4 py-4 sm:px-6">
                      <CardTitle className="flex flex-wrap items-center gap-3 text-base sm:text-lg">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white sm:h-10 sm:w-10">
                          <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <span className="min-w-0 flex-1">Tâches par acteurs</span>
                        {totalTasks > 0 && (
                          <Badge variant="secondary" className="font-normal">
                            {totalTasks}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Suivi des tâches regroupées par acteur et par action
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <ActorTasksSection groups={actorGroups} />
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
