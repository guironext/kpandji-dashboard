"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CommunicationProjectListItem } from "@/lib/actions/communication-project";
import {
  getPlanActionsWithActorsByProjectId,
  type PlanActionWithActors,
} from "@/lib/actions/communication-plan-action";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, GanttChart, Users, Sparkles } from "lucide-react";

const BAR_COLORS = [
  "bg-violet-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
  "bg-teal-500",
];

type Props = {
  projects: CommunicationProjectListItem[];
};

function GanttDateAxis({
  range,
}: {
  range: { min: number; max: number; span: number };
}) {
  const ticks = 6;
  const tickDates = Array.from({ length: ticks }, (_, i) => {
    const t = range.min + (range.span * i) / (ticks - 1);
    return new Date(t);
  });
  const minDate = format(new Date(range.min), "dd MMM yyyy", { locale: fr });
  const maxDate = format(new Date(range.max), "dd MMM yyyy", { locale: fr });

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{minDate}</span>
        <span>{maxDate}</span>
      </div>
      <div className="grid grid-cols-6 gap-2 text-[11px] font-medium text-slate-600">
        {tickDates.map((d, i) => (
          <span
            key={i}
            className={
              i === 0
                ? "text-left"
                : i === ticks - 1
                  ? "text-right"
                  : "text-center"
            }
          >
            {format(d, "dd MMM", { locale: fr })}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function MiseOeuvreClient({ projects }: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects[0]?.id ?? null
  );
  const [actions, setActions] = useState<PlanActionWithActors[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedProjectId) {
      setActions([]);
      return;
    }
    setLoading(true);
    getPlanActionsWithActorsByProjectId(selectedProjectId).then((res) => {
      setActions(res.success ? res.actions : []);
      setLoading(false);
    });
  }, [selectedProjectId]);

  const chartRange = useMemo(() => {
    if (actions.length === 0) return null;
    const starts = actions.map((a) => new Date(a.startDate).getTime());
    const ends = actions.map((a) => new Date(a.endDate).getTime());
    const min = Math.min(...starts);
    const max = Math.max(...ends);
    const span = max - min || 1;
    return { min, max, span };
  }, [actions]);

  const status = useMemo(() => {
    const now = Date.now();
    const upcoming = actions.filter((a) => new Date(a.startDate).getTime() > now).length;
    const active = actions.filter(
      (a) =>
        new Date(a.startDate).getTime() <= now &&
        new Date(a.endDate).getTime() >= now
    ).length;
    const done = actions.filter((a) => new Date(a.endDate).getTime() < now).length;
    return { upcoming, active, done };
  }, [actions]);

  return (
    <div className="space-y-8 p-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border bg-white/70 shadow-sm backdrop-blur">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(1200px 500px at 0% 0%, rgba(139,92,246,0.18), transparent 60%), radial-gradient(900px 450px at 100% 0%, rgba(34,211,238,0.14), transparent 55%), radial-gradient(1000px 500px at 50% 120%, rgba(251,191,36,0.14), transparent 55%)",
          }}
          aria-hidden
        />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-white/60 px-3 py-1 text-sm text-slate-700">
                <Sparkles className="size-4 text-violet-600" />
                Mise en œuvre
              </div>
              <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-900">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-sm">
                  <GanttChart className="size-5" />
                </span>
                Plan d&apos;action
              </h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Sélectionnez un projet pour visualiser la planification des actions, les acteurs
                assignés et le diagramme de Gantt.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <Badge variant="secondary" className="rounded-full bg-white/60">
                {projects.length} projet(s)
              </Badge>
              <Badge variant="secondary" className="rounded-full bg-white/60">
                {actions.length} action(s)
              </Badge>
              {selectedProjectId && actions.length > 0 && (
                <>
                  <Badge variant="secondary" className="rounded-full bg-white/60">
                    En cours: {status.active}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full bg-white/60">
                    À venir: {status.upcoming}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full bg-white/60">
                    Terminées: {status.done}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Project selection */}
      <Card className="bg-white/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GanttChart className="size-5" />
            Projet
          </CardTitle>
          <CardDescription>
            Choisissez le projet dont vous souhaitez visualiser le plan d&apos;action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-slate-50 p-5 text-slate-600">
              <div className="font-medium text-slate-800">Aucun projet trouvé.</div>
              <div className="mt-1 text-sm">
                Créez d&apos;abord un projet dans{" "}
                <span className="font-medium">Communication → Projets</span>, puis revenez ici.
              </div>
            </div>
          ) : (
            <Select
              value={selectedProjectId ?? ""}
              onValueChange={(v) => setSelectedProjectId(v || null)}
            >
              <SelectTrigger className="w-full max-w-xl border-2 border-slate-200">
                <SelectValue placeholder="Choisir un projet..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Actions table */}
      {selectedProjectId && (
        <Card className="overflow-hidden bg-white/70 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              Actions & planification
            </CardTitle>
            <CardDescription>
              Vue d&apos;ensemble des actions, acteurs assignés et calendrier.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                Chargement des actions...
              </div>
            ) : actions.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-gradient-to-br from-violet-50/50 to-cyan-50/50 p-12 text-center">
                <GanttChart className="mx-auto size-12 text-slate-300" />
                <p className="mt-3 font-medium text-slate-700">Aucune action pour ce projet</p>
                <p className="mt-1 text-sm text-slate-500">
                  Créez des actions dans le plan d&apos;action pour les visualiser ici.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200/80 bg-slate-50/80 hover:bg-slate-50/80">
                      <TableHead className="w-[22%] px-6 py-4 font-semibold text-slate-700">
                        Actions
                      </TableHead>
                      <TableHead className="w-[22%] px-6 py-4 font-semibold text-slate-700">
                        Acteurs
                      </TableHead>
                      <TableHead className="min-w-[320px] px-6 py-4 font-semibold text-slate-700">
                        Diagramme de Gantt
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chartRange && (
                      <TableRow className="border-b-0 bg-slate-50/50">
                        <TableCell colSpan={2} className="py-0" />
                        <TableCell className="px-6 py-6">
                          <GanttDateAxis range={chartRange} />
                        </TableCell>
                      </TableRow>
                    )}
                    {actions.map((action, idx) => (
                      <TableRow
                        key={action.id}
                        className="border-slate-100 transition-colors hover:bg-slate-50/50"
                      >
                        <TableCell className="px-6 py-4 font-medium text-slate-800 align-top">
                          {action.title}
                        </TableCell>
                        <TableCell className="px-6 py-4 align-top">
                          {action.assignedActors.length > 0 ? (
                            <ul className="space-y-1">
                              {action.assignedActors.map(({ actor }) => (
                                <li key={actor.id} className="text-sm text-slate-600">
                                  {actor.name}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4 align-top">
                          {chartRange && (
                            <GanttBar
                              action={action}
                              range={chartRange}
                              color={BAR_COLORS[idx % BAR_COLORS.length]}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function GanttBar({
  action,
  range,
  color,
}: {
  action: PlanActionWithActors;
  range: { min: number; max: number; span: number };
  color: string;
}) {
  const start = new Date(action.startDate).getTime();
  const end = new Date(action.endDate).getTime();
  const left = ((start - range.min) / range.span) * 100;
  const width = ((end - start) / range.span) * 100;

  return (
    <div className="relative h-9 rounded-lg bg-slate-100/80 overflow-hidden border border-slate-200/60">
      <div
        className={`absolute top-1 bottom-1 rounded-md ${color} shadow-sm hover:shadow-md transition-all cursor-default`}
        style={{
          left: `${Math.max(0, left)}%`,
          width: `${Math.max(3, Math.min(100 - left, width))}%`,
        }}
        title={`${action.title} — ${format(new Date(action.startDate), "dd MMM HH:mm", { locale: fr })} → ${format(new Date(action.endDate), "dd MMM HH:mm", { locale: fr })}`}
      />
    </div>
  );
}
