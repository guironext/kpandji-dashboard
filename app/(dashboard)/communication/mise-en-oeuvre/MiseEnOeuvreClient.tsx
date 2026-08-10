"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getMiseEnOeuvreDataByProjectId,
  type MiseEnOeuvreProjectData,
  type SerializedPlanActionTask,
} from "@/lib/actions/communication-mise-en-oeuvre";
import type { CommunicationProjectListItem } from "@/lib/actions/communication-project";
import {
  updatePlanActionTaskStage,
  type PlanActionTaskStage,
} from "@/lib/actions/communication-plan-action-task";
import {
  formatMiseEnOeuvreDate,
  MiseEnOeuvreStageDialog,
  MiseEnOeuvreTaskRow,
  type SelectedMiseEnOeuvreTask,
} from "@/components/communication/mise-en-oeuvre-task-ui";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import {
  Briefcase,
  Building2,
  ClipboardList,
  FolderKanban,
  Loader2,
  Rocket,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

type Props = {
  projects: CommunicationProjectListItem[];
};

type ViewMode = "action" | "actor";

export default function MiseEnOeuvreClient({ projects }: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects[0]?.id ?? null
  );
  const [data, setData] = useState<MiseEnOeuvreProjectData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("action");
  const [selectedTask, setSelectedTask] = useState<SelectedMiseEnOeuvreTask | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const loadProjectData = useCallback(async (projectId: string) => {
    setLoading(true);
    setLoadError(null);
    const res = await getMiseEnOeuvreDataByProjectId(projectId);
    setLoading(false);
    if (!res.success || !res.data) {
      setData(null);
      setLoadError(res.error ?? "Impossible de charger les tâches du projet.");
      return;
    }
    setData(res.data);
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setData(null);
      return;
    }
    void loadProjectData(selectedProjectId);
  }, [selectedProjectId, loadProjectData]);

  const patchTaskStage = (taskId: string, stage: PlanActionTaskStage) => {
    setData((prev) => {
      if (!prev) return prev;
      const patchTasks = (tasks: SerializedPlanActionTask[]) =>
        tasks.map((t) => (t.id === taskId ? { ...t, stage } : t));
      return {
        byAction: prev.byAction.map((a) => ({
          ...a,
          tasks: patchTasks(a.tasks),
        })),
        byActor: prev.byActor.map((row) => ({
          ...row,
          actions: row.actions.map((a) => ({
            ...a,
            tasks: patchTasks(a.tasks),
          })),
        })),
      };
    });
    if (selectedTask?.id === taskId) {
      setSelectedTask((t) => (t ? { ...t, stage } : t));
    }
  };

  const handleStageChange = async (stage: PlanActionTaskStage) => {
    if (!selectedTask) return;
    setUpdatingTaskId(selectedTask.id);
    const res = await updatePlanActionTaskStage(selectedTask.id, stage);
    setUpdatingTaskId(null);
    if (!res.success) {
      toast.error(res.error);
      if (selectedProjectId) void loadProjectData(selectedProjectId);
      return;
    }
    patchTaskStage(selectedTask.id, res.task.stage);
    toast.success("Étape mise à jour.");
    setSelectedTask(null);
  };

  const totalTasks =
    data?.byAction.reduce((sum, a) => sum + a.tasks.length, 0) ?? 0;

  return (
    <div className="min-h-full -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
      <section className="relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-sky-600 via-cyan-600 to-teal-700 px-4 pb-8 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_45%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm ring-1 ring-white/20">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Communication
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Mise en œuvre
              </h1>
              <p className="max-w-2xl text-sm text-white/90 sm:text-base">
                Suivez les tâches du plan d&apos;action par projet, regroupées par action ou par
                acteur. Cliquez sur une tâche pour modifier son étape.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-md lg:shrink-0">
              {[
                { label: "Projets", value: projects.length },
                { label: "Tâches", value: totalTasks },
                {
                  label: "Sélection",
                  value: selectedProject ? "1" : "0",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm ring-1 ring-white/20"
                >
                  <p className="text-xs font-medium text-sky-100/80">{stat.label}</p>
                  <p className="mt-0.5 text-2xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-0">
        {projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <FolderKanban className="h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-600">Aucun projet de communication pour le moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
            <Card className="h-fit border-slate-200/80 shadow-sm lg:sticky lg:top-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderKanban className="h-4 w-4 text-sky-600" />
                  Projets
                </CardTitle>
                <CardDescription>Sélectionnez un projet pour afficher ses tâches</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select
                  value={selectedProjectId ?? undefined}
                  onValueChange={(id) => setSelectedProjectId(id)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {p.projectStatus === "INACTIVE" ? " (inactif)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <ul className="max-h-[min(50vh,420px)] space-y-1 overflow-y-auto pr-1">
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
                              ? "bg-gradient-to-r from-sky-500 to-cyan-600 font-medium text-white shadow-md"
                              : "text-slate-700 hover:bg-slate-100"
                          )}
                        >
                          <Target
                            className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-sky-600")}
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
                              Inactif
                            </Badge>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {selectedProject && (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-0 bg-sky-100 text-sky-800">
                    <Rocket className="mr-1 h-3 w-3" />
                    {selectedProject.name}
                  </Badge>
                  <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setViewMode("action")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
                        viewMode === "action"
                          ? "bg-sky-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <ClipboardList className="h-3.5 w-3.5" />
                      Par action
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("actor")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
                        viewMode === "actor"
                          ? "bg-sky-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <Users className="h-3.5 w-3.5" />
                      Par acteur
                    </button>
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex min-h-[200px] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                </div>
              )}

              {!loading && loadError && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="py-6 text-sm text-red-700">{loadError}</CardContent>
                </Card>
              )}

              {!loading && !loadError && data && viewMode === "action" && (
                <div className="space-y-5">
                  {data.byAction.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-10 text-center text-sm text-slate-500">
                        Aucune action planifiée pour ce projet.
                      </CardContent>
                    </Card>
                  ) : (
                    data.byAction.map((action) => (
                      <section
                        key={action.id}
                        className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
                      >
                        <div className="border-b border-slate-100 bg-gradient-to-r from-sky-50/80 to-white px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-sky-600" />
                            <h2 className="text-sm font-bold text-slate-900">{action.title}</h2>
                            <Badge variant="secondary" className="text-xs font-normal">
                              {action.tasks.length} tâche{action.tasks.length > 1 ? "s" : ""}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatMiseEnOeuvreDate(action.startDate)} →{" "}
                            {formatMiseEnOeuvreDate(action.endDate)}
                          </p>
                          {action.assignedActors.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {action.assignedActors.map((actor) => (
                                <Badge
                                  key={actor.id}
                                  variant="outline"
                                  className="text-[10px] font-normal"
                                >
                                  <Users className="mr-1 h-3 w-3" />
                                  {actor.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="space-y-2 p-4">
                          {action.tasks.length === 0 ? (
                            <p className="text-sm text-slate-500">Aucune tâche pour cette action.</p>
                          ) : (
                            action.tasks.map((task) => (
                              <MiseEnOeuvreTaskRow
                                key={task.id}
                                task={task}
                                groupTitle={action.title}
                                updatingTaskId={updatingTaskId}
                                onSelect={setSelectedTask}
                              />
                            ))
                          )}
                        </div>
                      </section>
                    ))
                  )}
                </div>
              )}

              {!loading && !loadError && data && viewMode === "actor" && (
                <div className="space-y-5">
                  {data.byActor.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-10 text-center text-sm text-slate-500">
                        Aucun acteur associé à ce projet.
                      </CardContent>
                    </Card>
                  ) : (
                    data.byActor.map((row) => (
                      <section
                        key={row.actor.id}
                        className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
                      >
                        <div className="border-b border-slate-100 bg-gradient-to-r from-cyan-50/80 to-white px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Users className="h-4 w-4 text-cyan-600" />
                            <h2 className="text-sm font-bold text-slate-900">{row.actor.name}</h2>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {row.actor.department}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {row.actor.job}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-4 p-4">
                          {row.actions.length === 0 ? (
                            <p className="text-sm text-slate-500">
                              Aucune action assignée à cet acteur.
                            </p>
                          ) : (
                            row.actions.map((action) => (
                              <div key={action.id} className="space-y-2">
                                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                  <ClipboardList className="h-3.5 w-3.5" />
                                  {action.title}
                                </h3>
                                {action.tasks.length === 0 ? (
                                  <p className="pl-1 text-sm text-slate-400">Aucune tâche.</p>
                                ) : (
                                  action.tasks.map((task) => (
                                    <MiseEnOeuvreTaskRow
                                      key={task.id}
                                      task={task}
                                      groupTitle={action.title}
                                      actorName={row.actor.name}
                                      updatingTaskId={updatingTaskId}
                                      onSelect={setSelectedTask}
                                    />
                                  ))
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </section>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <MiseEnOeuvreStageDialog
        selectedTask={selectedTask}
        updatingTaskId={updatingTaskId}
        groupLabel="Action"
        onClose={() => setSelectedTask(null)}
        onStageChange={handleStageChange}
      />
    </div>
  );
}
