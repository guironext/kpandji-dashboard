"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PlanActionTaskWithContext } from "@/lib/actions/communication-plan-action-task";
import type { PlanActionTaskStage } from "@/lib/actions/communication-plan-action-task";
import {
  GANTT_STAGE_PICKER_OPTIONS,
  TASK_STAGE_OPTIONS,
  getTaskStageConfig,
  getTaskStageLabel,
} from "@/lib/plan-action-task-stage";
import { GanttChart, Check, ClipboardList, Loader2 } from "lucide-react";

type Props = {
  tasks: PlanActionTaskWithContext[];
  onStageChange: (taskId: string, stage: PlanActionTaskStage) => void | Promise<void>;
  updatingTaskId?: string | null;
};

type ActionGroup = {
  actionId: string;
  actionTitle: string;
  projectName: string;
  tasks: PlanActionTaskWithContext[];
};

function formatDuration(start: Date, end: Date): string {
  const days = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
  return `${days} jour${days > 1 ? "s" : ""}`;
}

function computeRange(taskList: PlanActionTaskWithContext[]) {
  if (taskList.length === 0) return null;
  const starts = taskList.map((t) => new Date(t.startDate).getTime());
  const ends = taskList.map((t) => new Date(t.endDate).getTime());
  const min = Math.min(...starts);
  const max = Math.max(...ends);
  const span = max - min || 1;
  return { min, max, span, minDate: new Date(min), maxDate: new Date(max) };
}

export default function TasksGanttChart({
  tasks,
  onStageChange,
  updatingTaskId,
}: Props) {
  const [selectedTask, setSelectedTask] = useState<PlanActionTaskWithContext | null>(null);

  const groups = useMemo(() => {
    const byAction = new Map<string, ActionGroup>();
    for (const task of tasks) {
      const existing = byAction.get(task.actionId);
      if (existing) {
        existing.tasks.push(task);
      } else {
        byAction.set(task.actionId, {
          actionId: task.actionId,
          actionTitle: task.actionTitle,
          projectName: task.projectName,
          tasks: [task],
        });
      }
    }
    return [...byAction.values()].sort((a, b) =>
      a.actionTitle.localeCompare(b.actionTitle, "fr")
    );
  }, [tasks]);

  const globalRange = useMemo(() => computeRange(tasks), [tasks]);

  if (!globalRange || tasks.length === 0) return null;

  const ticks = 6;
  const tickDates = Array.from({ length: ticks }, (_, i) => {
    const t = globalRange.min + (globalRange.span * i) / (ticks - 1);
    return new Date(t);
  });

  const handleStagePick = async (stage: PlanActionTaskStage) => {
    if (!selectedTask) return;
    await onStageChange(selectedTask.id, stage);
    setSelectedTask(null);
  };

  const selectedConfig = selectedTask ? getTaskStageConfig(selectedTask.stage) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <GanttChart className="h-4 w-4 text-sky-600" />
          <span>
            <span className="font-medium text-slate-800">Période :</span>{" "}
            {format(globalRange.minDate, "dd MMM yyyy", { locale: fr })}
            <span className="mx-1.5 text-slate-300">→</span>
            {format(globalRange.maxDate, "dd MMM yyyy", { locale: fr })}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Cliquez sur une barre pour modifier la couleur / l&apos;étape
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TASK_STAGE_OPTIONS.map((stage) => (
          <div
            key={stage.id}
            className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-sm"
          >
            <span className={cn("h-3 w-6 rounded", stage.swatchClass)} />
            {stage.label}
          </div>
        ))}
      </div>

      <div className="space-y-8">
        {groups.map((group) => {
          const groupRange = computeRange(group.tasks) ?? globalRange;

          return (
            <section
              key={group.actionId}
              className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-sky-50/80 to-white px-4 py-3">
                <ClipboardList className="h-4 w-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">{group.actionTitle}</h3>
                <Badge variant="secondary" className="text-xs font-normal">
                  {group.projectName}
                </Badge>
                <span className="text-xs text-slate-500">
                  {group.tasks.length} tâche{group.tasks.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="overflow-x-auto p-4 [-webkit-overflow-scrolling:touch]">
                <div className="min-w-[min(100%,720px)]">
                  <div className="mb-3 hidden grid-cols-6 gap-1 text-[11px] font-medium text-slate-500 sm:grid">
                    {tickDates.map((d, i) => (
                      <div
                        key={i}
                        className={cn(
                          i === 0 && "text-left",
                          i === ticks - 1 && "text-right",
                          i > 0 && i < ticks - 1 && "text-center"
                        )}
                      >
                        {format(d, "dd MMM", { locale: fr })}
                      </div>
                    ))}
                  </div>

                  <div className="relative space-y-3">
                    <div
                      className="pointer-events-none absolute inset-0 hidden rounded-lg sm:block"
                      aria-hidden
                    >
                      <div className="h-full w-full bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:16.66%_100%]" />
                    </div>

                    {group.tasks.map((task) => {
                      const start = new Date(task.startDate).getTime();
                      const end = new Date(task.endDate).getTime();
                      const left = ((start - groupRange.min) / groupRange.span) * 100;
                      const width = ((end - start) / groupRange.span) * 100;
                      const stageConfig = getTaskStageConfig(task.stage);
                      const isUpdating = updatingTaskId === task.id;
                      const tooltip = `${task.title} — ${getTaskStageLabel(task.stage)}`;

                      return (
                        <div key={task.id} className="relative">
                          <div className="mb-1.5 flex flex-wrap items-center gap-2 sm:hidden">
                            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
                              {task.title}
                            </p>
                            <Badge
                              variant="outline"
                              className={cn("text-[10px]", stageConfig.badgeClass)}
                            >
                              {stageConfig.label}
                            </Badge>
                          </div>

                          <div className="flex gap-3 sm:items-center">
                            <div className="w-[min(100%,200px)] shrink-0 space-y-1 sm:w-48">
                              <p className="truncate text-sm font-medium text-slate-900">
                                {task.title}
                              </p>
                              <Badge
                                variant="outline"
                                className={cn("hidden text-[10px] sm:inline-flex", stageConfig.badgeClass)}
                              >
                                {stageConfig.label}
                              </Badge>
                            </div>

                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => setSelectedTask(task)}
                              className="relative min-w-0 flex-1 block h-10 overflow-hidden rounded-lg bg-slate-100/80 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
                              title={tooltip}
                              aria-label={`${task.title}, ${stageConfig.label}, cliquer pour modifier`}
                            >
                              <span
                                className={cn(
                                  "absolute top-1.5 bottom-1.5 min-w-[6px] rounded-md shadow-sm transition-all",
                                  stageConfig.barClass,
                                  isUpdating && "animate-pulse opacity-60"
                                )}
                                style={{
                                  left: `${Math.max(0, left)}%`,
                                  width: `${Math.max(1.5, Math.min(100 - left, width))}%`,
                                }}
                              />
                            </button>

                            <span className="hidden w-14 shrink-0 text-right text-xs tabular-nums text-slate-500 sm:block">
                              {formatDuration(
                                new Date(task.startDate),
                                new Date(task.endDate)
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <Dialog
        open={selectedTask !== null}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Couleur de l&apos;étape</DialogTitle>
            <DialogDescription>
              {selectedTask ? (
                <>
                  Tâche : <span className="font-medium text-slate-800">{selectedTask.title}</span>
                  <br />
                  Action : {selectedTask.actionTitle}
                </>
              ) : (
                "Choisissez une couleur pour mettre à jour l'étape de la tâche."
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedTask && selectedConfig && (
            <div className="space-y-2 py-2">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Étape actuelle
              </p>
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <span className={cn("h-5 w-10 rounded", selectedConfig.swatchClass)} />
                <span className="text-sm font-medium text-slate-800">{selectedConfig.label}</span>
              </div>

              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Choisir une couleur
              </p>
              <div className="grid gap-2">
                {GANTT_STAGE_PICKER_OPTIONS.map((option) => {
                  const selected = selectedTask.stage === option.id;
                  const isUpdating = updatingTaskId === selectedTask.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={isUpdating}
                      onClick={() => void handleStagePick(option.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                        selected
                          ? "border-sky-400 bg-sky-50/60 shadow-sm"
                          : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <span
                        className={cn("h-8 w-14 shrink-0 rounded-lg shadow-inner", option.swatchClass)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-900">
                          {option.label}
                        </span>
                        <span className="block text-xs text-slate-500">{option.colorHint}</span>
                      </span>
                      {selected && <Check className="h-5 w-5 shrink-0 text-sky-600" />}
                      {isUpdating && selected && (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-sky-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSelectedTask(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
