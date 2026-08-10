"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, Loader2, Users } from "lucide-react";
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
import {
  ALL_TASK_STAGE_OPTIONS,
  getTaskStageConfig,
  type TaskStageId,
} from "@/lib/plan-action-task-stage";
import { cn } from "@/lib/utils";

export type MiseEnOeuvreDisplayTask = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  stage: TaskStageId;
};

export type SelectedMiseEnOeuvreTask = MiseEnOeuvreDisplayTask & {
  groupTitle: string;
  actorName?: string;
};

export function formatMiseEnOeuvreDate(iso: string): string {
  try {
    return format(new Date(iso), "dd MMM yyyy", { locale: fr });
  } catch {
    return iso;
  }
}

export function MiseEnOeuvreTaskRow({
  task,
  groupTitle,
  actorName,
  updatingTaskId,
  onSelect,
}: {
  task: MiseEnOeuvreDisplayTask;
  groupTitle: string;
  actorName?: string;
  updatingTaskId: string | null;
  onSelect: (ctx: SelectedMiseEnOeuvreTask) => void;
}) {
  const stageConfig = getTaskStageConfig(task.stage);
  const isUpdating = updatingTaskId === task.id;

  return (
    <button
      type="button"
      disabled={isUpdating}
      onClick={() => onSelect({ ...task, groupTitle, actorName })}
      className={cn(
        "group flex w-full flex-col gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-left shadow-sm transition hover:border-sky-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2",
        isUpdating && "opacity-60"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 flex-1 font-medium text-slate-900 group-hover:text-sky-800">
          {task.title}
        </p>
        <Badge variant="outline" className={cn("shrink-0 text-[10px]", stageConfig.badgeClass)}>
          {stageConfig.label}
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span>
          {formatMiseEnOeuvreDate(task.startDate)} → {formatMiseEnOeuvreDate(task.endDate)}
        </span>
        {actorName && (
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {actorName}
          </span>
        )}
      </div>
      <span className={cn("h-1.5 w-full rounded-full", stageConfig.swatchClass)} aria-hidden />
    </button>
  );
}

export function MiseEnOeuvreStageDialog({
  selectedTask,
  updatingTaskId,
  groupLabel = "Action",
  onClose,
  onStageChange,
}: {
  selectedTask: SelectedMiseEnOeuvreTask | null;
  updatingTaskId: string | null;
  groupLabel?: string;
  onClose: () => void;
  onStageChange: (stage: TaskStageId) => void | Promise<void>;
}) {
  const selectedConfig = selectedTask ? getTaskStageConfig(selectedTask.stage) : null;

  return (
    <Dialog open={selectedTask !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Étape de la tâche</DialogTitle>
          <DialogDescription>
            {selectedTask ? (
              <>
                <span className="font-medium text-slate-800">{selectedTask.title}</span>
                <br />
                {groupLabel} : {selectedTask.groupTitle}
                {selectedTask.actorName && (
                  <>
                    <br />
                    Acteur : {selectedTask.actorName}
                  </>
                )}
              </>
            ) : (
              "Choisissez une étape pour la tâche."
            )}
          </DialogDescription>
        </DialogHeader>

        {selectedTask && selectedConfig && (
          <div className="space-y-2 py-2">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Étape actuelle
            </p>
            <div
              className={cn(
                "mb-4 flex items-center gap-2 rounded-lg border px-3 py-2",
                selectedTask.stage === "VALIDEE" &&
                  "border-emerald-300 bg-emerald-50 text-emerald-900",
                selectedTask.stage === "TERMINEE" &&
                  "border-[#6b4423]/40 bg-[#ebe3d9] text-[#4a3520]",
                selectedTask.stage !== "VALIDEE" &&
                  selectedTask.stage !== "TERMINEE" &&
                  "border-slate-200 bg-slate-50"
              )}
            >
              <span className={cn("h-5 w-10 rounded", selectedConfig.swatchClass)} />
              <span className="text-sm font-medium">{selectedConfig.label}</span>
            </div>

            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Choisir une étape
            </p>
            <div className="grid max-h-[min(50vh,360px)] gap-2 overflow-y-auto pr-1">
              {ALL_TASK_STAGE_OPTIONS.map((option) => {
                const selected = selectedTask.stage === option.id;
                const isUpdating = updatingTaskId === selectedTask.id;
                const isValidee = option.id === "VALIDEE";
                const isTerminee = option.id === "TERMINEE";

                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={isUpdating}
                    onClick={() => void onStageChange(option.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                      selected && !isValidee && !isTerminee && "border-sky-400 bg-sky-50/60",
                      selected && isValidee && "border-emerald-500 bg-emerald-50",
                      selected && isTerminee && "border-[#6b4423] bg-[#ebe3d9]",
                      !selected && isValidee && "border-emerald-200/80 bg-emerald-50/40 hover:bg-emerald-50",
                      !selected && isTerminee && "border-[#6b4423]/25 bg-[#f5f0ea] hover:bg-[#ebe3d9]",
                      !selected &&
                        !isValidee &&
                        !isTerminee &&
                        "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <span
                      className={cn(
                        "h-8 w-14 shrink-0 rounded-lg shadow-inner",
                        option.swatchClass,
                        isValidee && "bg-emerald-500",
                        isTerminee && "bg-[#6b4423]"
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">
                        {option.label}
                      </span>
                      <span className="block text-xs text-slate-500">{option.colorHint}</span>
                    </span>
                    {selected && <Check className="h-5 w-5 shrink-0 text-slate-700" />}
                    {isUpdating && selected && (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
