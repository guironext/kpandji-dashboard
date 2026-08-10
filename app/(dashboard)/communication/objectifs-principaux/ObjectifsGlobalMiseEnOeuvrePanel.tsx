"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  Building2,
  ClipboardList,
  Loader2,
  RefreshCw,
  Target,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatMiseEnOeuvreDate,
  MiseEnOeuvreStageDialog,
  MiseEnOeuvreTaskRow,
  type SelectedMiseEnOeuvreTask,
} from "@/components/communication/mise-en-oeuvre-task-ui";
import {
  updateObjectifGlobalTaskStage,
  type ObjectifGlobalMiseEnOeuvreData,
  type SerializedObjectifGlobalTask,
} from "@/lib/actions/objectif-global-task";
import type { TaskStageId } from "@/lib/plan-action-task-stage";
import { cn } from "@/lib/utils";

type ViewMode = "objectif" | "actor";

type Props = {
  loading: boolean;
  loadError: string | null;
  data: ObjectifGlobalMiseEnOeuvreData | null;
  onRefresh: () => Promise<void>;
};

function patchTaskStage(
  data: ObjectifGlobalMiseEnOeuvreData,
  taskId: string,
  stage: TaskStageId
): ObjectifGlobalMiseEnOeuvreData {
  const patchTasks = (tasks: SerializedObjectifGlobalTask[]) =>
    tasks.map((t) => (t.id === taskId ? { ...t, stage } : t));

  return {
    byObjectif: data.byObjectif.map((group) => ({
      ...group,
      tasks: patchTasks(group.tasks),
    })),
    byActor: data.byActor.map((row) => ({
      ...row,
      objectifs: row.objectifs.map((objectif) => ({
        ...objectif,
        tasks: patchTasks(objectif.tasks),
      })),
    })),
  };
}

export default function ObjectifsGlobalMiseEnOeuvrePanel({
  loading,
  loadError,
  data,
  onRefresh,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("actor");
  const [localData, setLocalData] = useState<ObjectifGlobalMiseEnOeuvreData | null>(data);
  const [selectedTask, setSelectedTask] = useState<SelectedMiseEnOeuvreTask | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const displayData = localData ?? data;
  const totalTasks =
    displayData?.byObjectif.reduce((sum, group) => sum + group.tasks.length, 0) ?? 0;

  useEffect(() => {
    if (!selectedTask && !updatingTaskId) {
      setLocalData(data);
    }
  }, [data, selectedTask, updatingTaskId]);

  const handleStageChange = async (stage: TaskStageId) => {
    if (!selectedTask || !displayData) return;
    setUpdatingTaskId(selectedTask.id);
    const res = await updateObjectifGlobalTaskStage(selectedTask.id, stage);
    setUpdatingTaskId(null);
    if (!res.success) {
      toast.error(res.error);
      await onRefresh();
      return;
    }
    setLocalData(patchTaskStage(displayData, selectedTask.id, res.task.stage));
    toast.success("Étape mise à jour.");
    setSelectedTask(null);
    await onRefresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (loadError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-red-700">{loadError}</p>
          <Button type="button" variant="outline" onClick={() => void onRefresh()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!displayData || totalTasks === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-sm text-slate-500">
          Aucune tâche en attente de validation pour le moment.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-0 bg-sky-100 text-sky-800">
            <Target className="mr-1 h-3 w-3" />
            Objectifs principaux
          </Badge>
          <Badge variant="secondary" className="text-xs font-normal">
            {totalTasks} tâche{totalTasks !== 1 ? "s" : ""}
          </Badge>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("objectif")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
                viewMode === "objectif"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Par objectif
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

        {viewMode === "objectif" && (
          <div className="space-y-5">
            {displayData.byObjectif.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center text-sm text-slate-500">
                  Aucun objectif planifié.
                </CardContent>
              </Card>
            ) : (
              displayData.byObjectif.map((group) => (
                <section
                  key={group.id}
                  className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
                >
                  <div className="border-b border-slate-100 bg-gradient-to-r from-sky-50/80 to-white px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-sky-600" />
                      <h2 className="text-sm font-bold text-slate-900">{group.title}</h2>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {group.tasks.length} tâche{group.tasks.length > 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatMiseEnOeuvreDate(group.startDate)} →{" "}
                      {formatMiseEnOeuvreDate(group.endDate)}
                    </p>
                    {group.rubrique && (
                      <p className="mt-1 text-xs text-slate-500">Rubrique : {group.rubrique}</p>
                    )}
                    {group.assignedActors.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {group.assignedActors.map((actor) => (
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
                    {group.tasks.length === 0 ? (
                      <p className="text-sm text-slate-500">Aucune tâche pour cet objectif.</p>
                    ) : (
                      group.tasks.map((task) => (
                        <MiseEnOeuvreTaskRow
                          key={task.id}
                          task={task}
                          groupTitle={group.title}
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

        {viewMode === "actor" && (
          <div className="space-y-5">
            {displayData.byActor.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center text-sm text-slate-500">
                  Aucun acteur associé.
                </CardContent>
              </Card>
            ) : (
              displayData.byActor.map((row) => (
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
                    {row.objectifs.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        Aucun objectif assigné à cet acteur.
                      </p>
                    ) : (
                      row.objectifs.map((objectif) => (
                        <div key={objectif.id} className="space-y-2">
                          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            <ClipboardList className="h-3.5 w-3.5" />
                            {objectif.title}
                          </h3>
                          {objectif.tasks.length === 0 ? (
                            <p className="pl-1 text-sm text-slate-400">Aucune tâche.</p>
                          ) : (
                            objectif.tasks.map((task) => (
                              <MiseEnOeuvreTaskRow
                                key={task.id}
                                task={task}
                                groupTitle={objectif.title}
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

      <MiseEnOeuvreStageDialog
        selectedTask={selectedTask}
        updatingTaskId={updatingTaskId}
        groupLabel="Objectif"
        onClose={() => setSelectedTask(null)}
        onStageChange={handleStageChange}
      />
    </>
  );
}
