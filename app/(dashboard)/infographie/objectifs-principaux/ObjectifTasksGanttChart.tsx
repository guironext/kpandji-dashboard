"use client";

import { useMemo } from "react";
import type { ObjectifGlobalTaskWithContext } from "@/lib/actions/objectif-global-task";
import type { PlanActionTaskWithContext } from "@/lib/actions/communication-plan-action-task";
import type { PlanActionTaskStage } from "@/lib/actions/communication-plan-action-task";
import TasksGanttChart from "@/app/(dashboard)/infographie/projets/TasksGanttChart";

type Props = {
  tasks: ObjectifGlobalTaskWithContext[];
  onStageChange: (taskId: string, stage: PlanActionTaskStage) => void | Promise<void>;
  updatingTaskId?: string | null;
};

function mapToGanttTasks(tasks: ObjectifGlobalTaskWithContext[]): PlanActionTaskWithContext[] {
  return tasks.map((task) => ({
    id: task.id,
    actionId: task.objectifId,
    title: task.title,
    startDate: task.startDate,
    endDate: task.endDate,
    stage: task.stage,
    orderIndex: task.orderIndex,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    actionTitle: task.objectifTitle,
    projectId: task.objectifId,
    projectName: task.rubrique,
  }));
}

export default function ObjectifTasksGanttChart({ tasks, onStageChange, updatingTaskId }: Props) {
  const ganttTasks = useMemo(() => mapToGanttTasks(tasks), [tasks]);
  return (
    <TasksGanttChart
      tasks={ganttTasks}
      onStageChange={onStageChange}
      updatingTaskId={updatingTaskId}
    />
  );
}
