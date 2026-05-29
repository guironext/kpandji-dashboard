"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getPlanActionsByProjectId,
  createPlanAction,
  updatePlanAction,
  deletePlanAction,
  type PlanActionItem,
} from "@/lib/actions/communication-plan-action";
import type { CommunicationProjectListItem } from "@/lib/actions/communication-project";
import { toast } from "sonner";
import {
  Calendar,
  Plus,
  Trash2,
  GanttChart,
  Loader2,
  Clock,
  Sparkles,
  ArrowRight,
  Search,
  List,
  CheckCircle2,
  PlayCircle,
  CircleDashed,
} from "lucide-react";
import { format, addDays, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

type ActionStatus = "upcoming" | "active" | "done";

const STATUS_CONFIG: Record<
  ActionStatus,
  { label: string; className: string; icon: typeof CircleDashed }
> = {
  upcoming: {
    label: "À venir",
    className: "bg-sky-50 text-sky-700 border-sky-200",
    icon: CircleDashed,
  },
  active: {
    label: "En cours",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: PlayCircle,
  },
  done: {
    label: "Terminée",
    className: "bg-slate-100 text-slate-600 border-slate-200",
    icon: CheckCircle2,
  },
};

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(s: string): Date {
  return new Date(s);
}

function getActionStatus(action: PlanActionItem): ActionStatus {
  const now = Date.now();
  const start = new Date(action.startDate).getTime();
  const end = new Date(action.endDate).getTime();
  if (end < now) return "done";
  if (start <= now && end >= now) return "active";
  return "upcoming";
}

function formatDuration(start: Date, end: Date): string {
  const mins = differenceInMinutes(end, start);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days} j ${remHours} h` : `${days} j`;
}

type Props = {
  projects: CommunicationProjectListItem[];
  initialActions: PlanActionItem[];
  selectedProjectId: string | null;
  embedded?: boolean;
};

export default function PlanActionClient({
  projects,
  initialActions,
  selectedProjectId: initialProjectId,
  embedded,
}: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    initialProjectId ?? (projects[0]?.id ?? null)
  );
  const [actions, setActions] = useState<PlanActionItem[]>(initialActions);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chart">("list");
  const [form, setForm] = useState({
    title: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (!selectedProjectId) {
      setActions([]);
      return;
    }
    setLoading(true);
    getPlanActionsByProjectId(selectedProjectId).then((res) => {
      setActions(res.success ? res.actions : []);
      setLoading(false);
    });
  }, [selectedProjectId]);

  const resetForm = () => {
    setForm({ title: "", startDate: "", endDate: "" });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAdd = () => {
    const now = new Date();
    const start = new Date(now);
    const end = addDays(now, 1);
    setForm({
      title: "",
      startDate: toDatetimeLocal(start),
      endDate: toDatetimeLocal(end),
    });
    setIsAdding(true);
    setEditingId(null);
    setMobileView("list");
  };

  const handleEdit = (action: PlanActionItem) => {
    setForm({
      title: action.title,
      startDate: toDatetimeLocal(new Date(action.startDate)),
      endDate: toDatetimeLocal(new Date(action.endDate)),
    });
    setEditingId(action.id);
    setIsAdding(false);
    setMobileView("list");
  };

  const handleSaveNew = async () => {
    if (!selectedProjectId || !form.title.trim()) {
      toast.error("Veuillez sélectionner un projet et saisir un intitulé.");
      return;
    }
    if (!form.startDate || !form.endDate) {
      toast.error("Veuillez renseigner les dates de début et de fin.");
      return;
    }
    const startDate = fromDatetimeLocal(form.startDate);
    const endDate = fromDatetimeLocal(form.endDate);
    if (endDate < startDate) {
      toast.error("La date de fin doit être après la date de début.");
      return;
    }
    const res = await createPlanAction(selectedProjectId, {
      title: form.title.trim(),
      startDate,
      endDate,
    });
    if (res.success) {
      setActions((prev) => [...prev, res.action].sort((a, b) => a.orderIndex - b.orderIndex));
      resetForm();
      toast.success("Action ajoutée.");
    } else {
      toast.error(res.error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !form.title.trim() || !form.startDate || !form.endDate) return;
    const startDate = fromDatetimeLocal(form.startDate);
    const endDate = fromDatetimeLocal(form.endDate);
    if (endDate < startDate) {
      toast.error("La date de fin doit être après la date de début.");
      return;
    }
    const res = await updatePlanAction(editingId, {
      title: form.title.trim(),
      startDate,
      endDate,
    });
    if (res.success) {
      setActions((prev) =>
        prev.map((a) => (a.id === editingId ? res.action : a))
      );
      resetForm();
      toast.success("Action mise à jour.");
    } else {
      toast.error(res.error);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deletePlanAction(id);
    if (res.success) {
      setActions((prev) => prev.filter((a) => a.id !== id));
      if (editingId === id) resetForm();
      toast.success("Action supprimée.");
    } else {
      toast.error(res.error);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const chartRange = useMemo(() => {
    if (actions.length === 0) return null;
    const starts = actions.map((a) => new Date(a.startDate).getTime());
    const ends = actions.map((a) => new Date(a.endDate).getTime());
    const min = Math.min(...starts);
    const max = Math.max(...ends);
    const span = max - min || 1;
    return { min, max, span };
  }, [actions]);

  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) => a.title.toLowerCase().includes(q));
  }, [actions, query]);

  const status = useMemo(() => {
    const now = Date.now();
    const upcoming = actions.filter((a) => new Date(a.startDate).getTime() > now).length;
    const active = actions.filter(
      (a) =>
        new Date(a.startDate).getTime() <= now && new Date(a.endDate).getTime() >= now
    ).length;
    const done = actions.filter((a) => new Date(a.endDate).getTime() < now).length;
    return { upcoming, active, done };
  }, [actions]);

  const actionsListContent = (
    <>
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-sm">Chargement des actions…</span>
        </div>
      ) : (
        <>
          {actions.length === 0 && !isAdding ? (
            <EmptyActionsState onAdd={handleAdd} />
          ) : null}

          <ul className="space-y-2.5 sm:space-y-3">
            {filteredActions.map((action, idx) => (
              <ActionListItem
                key={action.id}
                action={action}
                colorClass={BAR_COLORS[idx % BAR_COLORS.length]}
                isEditing={editingId === action.id}
                form={form}
                setForm={setForm}
                onSave={handleSaveEdit}
                onCancel={resetForm}
                onEdit={() => handleEdit(action)}
                onDelete={() => handleDelete(action.id)}
              />
            ))}
          </ul>

          {isAdding ? (
            <div className="rounded-xl border border-dashed border-violet-300 bg-gradient-to-br from-violet-50/70 to-fuchsia-50/40 p-3 sm:p-4">
              <ActionFormFields
                form={form}
                setForm={setForm}
                onSave={handleSaveNew}
                onCancel={resetForm}
                saveLabel="Ajouter l'action"
              />
            </div>
          ) : null}

          {actions.length > 0 && filteredActions.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-slate-50 p-4 sm:p-5 text-slate-600">
              <p className="font-medium text-slate-800">Aucun résultat</p>
              <p className="mt-1 text-sm">Essayez un autre mot-clé dans la recherche.</p>
            </div>
          ) : null}
        </>
      )}
    </>
  );

  const chartContent =
    actions.length > 0 && chartRange ? (
      <TimeChart actions={actions} range={chartRange} />
    ) : (
      <EmptyChartState />
    );

  return (
    <div
      className={cn(
        "space-y-4 sm:space-y-6",
        embedded ? "p-3 sm:p-5 lg:p-6" : "mx-auto max-w-7xl p-4 sm:p-6 lg:p-8"
      )}
    >
      {!embedded && (
        <PageHero
          projectsCount={projects.length}
          actionsCount={actions.length}
          status={status}
          showStatus={Boolean(selectedProjectId && actions.length > 0)}
        />
      )}

      {embedded && selectedProjectId && actions.length > 0 && (
        <StatsRow status={status} total={actions.length} compact />
      )}

      <Card className="border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="size-4 sm:size-5 shrink-0 text-violet-600" />
            Projet
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Sélectionnez le projet pour lequel vous souhaitez planifier les actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {projects.length === 0 ? (
            <NoProjectsState />
          ) : (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end lg:grid-cols-[minmax(0,1fr)_minmax(0,16rem)_auto]">
              <div className="min-w-0">
                <Label htmlFor="plan-project" className="mb-1.5 text-xs font-medium text-slate-600">
                  Projet actif
                </Label>
                <Select
                  value={selectedProjectId ?? ""}
                  onValueChange={(v) => setSelectedProjectId(v || null)}
                >
                  <SelectTrigger id="plan-project" className="mt-0 h-10 w-full bg-white sm:h-11">
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
              </div>

              {selectedProjectId && (
                <div className="min-w-0">
                  <Label htmlFor="plan-search" className="mb-1.5 text-xs font-medium text-slate-600">
                    Recherche
                  </Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="plan-search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Filtrer les actions…"
                      className="h-10 bg-white pl-9 sm:h-11"
                    />
                  </div>
                </div>
              )}

              {selectedProjectId && (
                <Button
                  onClick={handleAdd}
                  className="h-10 w-full gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm hover:from-violet-700 hover:to-fuchsia-700 sm:h-11 sm:w-auto sm:min-w-[10.5rem] lg:self-end"
                >
                  <Plus className="size-4 shrink-0" />
                  Nouvelle action
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedProjectId && (
        <>
          {!embedded && actions.length > 0 && (
            <StatsRow status={status} total={actions.length} />
          )}

          <div className="lg:hidden">
            <Tabs
              value={mobileView}
              onValueChange={(v) => setMobileView(v as "list" | "chart")}
              className="w-full"
            >
              <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-slate-100/80 p-1">
                <TabsTrigger
                  value="list"
                  className="gap-2 rounded-lg text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <List className="size-4 shrink-0" />
                  Actions ({filteredActions.length})
                </TabsTrigger>
                <TabsTrigger
                  value="chart"
                  className="gap-2 rounded-lg text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <GanttChart className="size-4 shrink-0" />
                  Diagramme
                </TabsTrigger>
              </TabsList>
              <TabsContent value="list" className="mt-4 focus-visible:outline-none">
                <Card className="border-slate-200/80 bg-white/80 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                      <Clock className="size-4 text-violet-600" />
                      Actions
                      {selectedProject && (
                        <span className="truncate text-sm font-normal text-muted-foreground max-w-[min(100%,14rem)]">
                          — {selectedProject.name}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">{actionsListContent}</CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="chart" className="mt-4 focus-visible:outline-none">
                <Card className="border-slate-200/80 bg-white/80 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <GanttChart className="size-4 text-violet-600" />
                      Diagramme (Gantt)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Durée et position des actions sur la période du projet.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">{chartContent}</CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex flex-col gap-6">
            <Card className="border-slate-200/80 bg-white/80 shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <Clock className="size-5 text-violet-600" />
                  Actions
                  {selectedProject && (
                    <span className="text-sm font-normal text-muted-foreground">
                      — {selectedProject.name}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Ajoutez des actions et renseignez la date/heure de début et de fin.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[min(70vh,720px)] space-y-4 overflow-y-auto pr-1">
                {actionsListContent}
              </CardContent>
            </Card>

            <Card className="h-fit border-slate-200/80 bg-white/80 shadow-sm lg:col-span-3 lg:sticky lg:top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GanttChart className="size-5 text-violet-700" />
                  Diagramme (Gantt)
                </CardTitle>
                <CardDescription>
                  Durée et position des actions sur la période du projet.
                </CardDescription>
              </CardHeader>
              <CardContent>{chartContent}</CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function PageHero({
  projectsCount,
  actionsCount,
  status,
  showStatus,
}: {
  projectsCount: number;
  actionsCount: number;
  status: { upcoming: number; active: number; done: number };
  showStatus: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 shadow-sm backdrop-blur">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(1200px 500px at 0% 0%, rgba(139,92,246,0.18), transparent 60%), radial-gradient(900px 450px at 100% 0%, rgba(34,211,238,0.14), transparent 55%), radial-gradient(1000px 500px at 50% 120%, rgba(251,191,36,0.14), transparent 55%)",
        }}
        aria-hidden
      />
      <div className="relative p-5 sm:p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border bg-white/60 px-3 py-1 text-xs text-slate-700 sm:text-sm">
              <Sparkles className="size-3.5 shrink-0 text-violet-600 sm:size-4" />
              Planning & exécution
            </div>
            <h1 className="mt-3 flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900 sm:gap-3 sm:text-3xl">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-sm sm:size-10">
                <GanttChart className="size-4 sm:size-5" />
              </span>
              Plan d&apos;action
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
              Sélectionnez un projet, définissez chaque action avec ses dates de début et de fin,
              puis visualisez le planning en diagramme de Gantt.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
            <Badge variant="secondary" className="rounded-full bg-white/70">
              {projectsCount} projet{projectsCount !== 1 ? "s" : ""}
            </Badge>
            <Badge variant="secondary" className="rounded-full bg-white/70">
              {actionsCount} action{actionsCount !== 1 ? "s" : ""}
            </Badge>
            {showStatus && (
              <>
                <Badge
                  variant="secondary"
                  className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-800"
                >
                  En cours: {status.active}
                </Badge>
                <Badge
                  variant="secondary"
                  className="rounded-full border-sky-200 bg-sky-50 text-sky-800"
                >
                  À venir: {status.upcoming}
                </Badge>
                <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-700">
                  Terminées: {status.done}
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsRow({
  status,
  total,
  compact,
}: {
  status: { upcoming: number; active: number; done: number };
  total: number;
  compact?: boolean;
}) {
  const items = [
    { label: "Total", value: total, accent: "from-violet-500 to-fuchsia-500" },
    { label: "En cours", value: status.active, accent: "from-emerald-500 to-teal-500" },
    { label: "À venir", value: status.upcoming, accent: "from-sky-500 to-cyan-500" },
    { label: "Terminées", value: status.done, accent: "from-slate-400 to-slate-500" },
  ];

  return (
    <div
      className={cn(
        "grid gap-2 sm:gap-3",
        compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 lg:grid-cols-4"
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
            {item.label}
          </p>
          <p
            className={cn(
              "mt-1 bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent sm:text-3xl",
              item.accent
            )}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function NoProjectsState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-slate-600 sm:p-5">
      <p className="font-medium text-slate-800">Aucun projet trouvé</p>
      <p className="mt-1 text-sm">
        Créez d&apos;abord un projet dans{" "}
        <span className="font-medium text-slate-700">Communication → Projets</span>, puis revenez
        ici pour planifier les actions.
      </p>
    </div>
  );
}

function EmptyActionsState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-violet-200 bg-gradient-to-br from-violet-50/80 to-cyan-50/50 p-5 sm:p-6">
      <p className="font-medium text-slate-900">Commencez votre planning</p>
      <p className="mt-1 text-sm text-slate-600">
        Ajoutez la première action, puis visualisez sa durée dans le diagramme.
      </p>
      <Button
        onClick={onAdd}
        className="mt-3 w-full gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 sm:w-fit"
      >
        <Plus className="size-4" />
        Ajouter une action
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}

function EmptyChartState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-violet-50/40 p-5 text-slate-600 sm:p-6">
      <p className="font-medium text-slate-900">Votre diagramme apparaîtra ici</p>
      <p className="mt-1 text-sm">
        Ajoutez au moins une action avec une date de début et de fin.
      </p>
    </div>
  );
}

function ActionStatusBadge({ action }: { action: PlanActionItem }) {
  const status = getActionStatus(action);
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={cn("shrink-0 text-[10px] sm:text-xs", config.className)}>
      <Icon className="mr-1 size-3" />
      {config.label}
    </Badge>
  );
}

function ActionListItem({
  action,
  colorClass,
  isEditing,
  form,
  setForm,
  onSave,
  onCancel,
  onEdit,
  onDelete,
}: {
  action: PlanActionItem;
  colorClass: string;
  isEditing: boolean;
  form: { title: string; startDate: string; endDate: string };
  setForm: Dispatch<SetStateAction<{ title: string; startDate: string; endDate: string }>>;
  onSave: () => void;
  onCancel: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const start = new Date(action.startDate);
  const end = new Date(action.endDate);

  if (isEditing) {
    return (
      <li className="rounded-xl border border-violet-200 bg-violet-50/30 p-3 shadow-sm sm:p-4">
        <ActionFormFields
          form={form}
          setForm={setForm}
          onSave={onSave}
          onCancel={onCancel}
          saveLabel="Enregistrer"
        />
      </li>
    );
  }

  return (
    <li className="group rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 gap-3">
          <div
            className={cn("mt-1.5 size-2.5 shrink-0 rounded-full shadow-sm", colorClass)}
            aria-hidden
          />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="break-words font-medium text-slate-900">{action.title}</p>
              <ActionStatusBadge action={action} />
            </div>
            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
              <span className="whitespace-nowrap">
                {format(start, "dd MMM yyyy, HH:mm", { locale: fr })}
              </span>
              <span className="mx-1.5 text-slate-300">→</span>
              <span className="whitespace-nowrap">
                {format(end, "dd MMM yyyy, HH:mm", { locale: fr })}
              </span>
            </p>
            <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 sm:text-xs">
              {formatDuration(start, end)}
            </span>
          </div>
        </div>
        <div className="flex gap-2 sm:shrink-0">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={onEdit}>
            Modifier
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700 sm:flex-none sm:px-2.5"
            onClick={onDelete}
            aria-label="Supprimer l'action"
          >
            <Trash2 className="size-4" />
            <span className="sm:sr-only">Supprimer</span>
          </Button>
        </div>
      </div>
    </li>
  );
}

function ActionFormFields({
  form,
  setForm,
  onSave,
  onCancel,
  saveLabel,
}: {
  form: { title: string; startDate: string; endDate: string };
  setForm: Dispatch<SetStateAction<{ title: string; startDate: string; endDate: string }>>;
  onSave: () => void;
  onCancel: () => void;
  saveLabel: string;
}) {
  return (
    <div className="grid w-full gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-1">
          <Label className="text-xs sm:text-sm">Intitulé</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Ex. Lancement campagne réseaux sociaux"
            className="mt-1.5 h-10 bg-white sm:h-11"
          />
        </div>
        <div>
          <Label className="text-xs sm:text-sm">Début</Label>
          <Input
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            className="mt-1.5 h-10 bg-white sm:h-11"
          />
        </div>
        <div>
          <Label className="text-xs sm:text-sm">Fin</Label>
          <Input
            type="datetime-local"
            value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            className="mt-1.5 h-10 bg-white sm:h-11"
          />
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onCancel} className="h-10 w-full sm:h-11 sm:w-auto">
          Annuler
        </Button>
        <Button
          onClick={onSave}
          className="h-10 w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 sm:h-11 sm:w-auto"
        >
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}

function TimeChart({
  actions,
  range,
}: {
  actions: PlanActionItem[];
  range: { min: number; max: number; span: number };
}) {
  const minDate = new Date(range.min);
  const maxDate = new Date(range.max);
  const ticks = 6;
  const tickDates = Array.from({ length: ticks }, (_, i) => {
    const t = range.min + (range.span * i) / (ticks - 1);
    return new Date(t);
  });

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-1 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
        <p className="min-w-0 break-words">
          <span className="font-medium text-slate-700">Période :</span>{" "}
          {format(minDate, "dd MMM yyyy", { locale: fr })}
          <span className="mx-1 text-slate-400">→</span>
          {format(maxDate, "dd MMM yyyy", { locale: fr })}
        </p>
        <p className="hidden text-xs text-slate-500 sm:block">
          Survolez une barre pour les détails
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4 [-webkit-overflow-scrolling:touch]">
        <div className="min-w-[260px]">
          <div className="relative mb-3 hidden grid-cols-6 gap-1 text-[11px] text-slate-500 sm:grid">
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

          <div className="relative space-y-3 sm:space-y-2.5">
            <div className="pointer-events-none absolute inset-0 hidden sm:block">
              <div className="h-full w-full rounded-lg bg-[linear-gradient(to_right,rgba(15,23,42,0.05)_1px,transparent_1px)] [background-size:20%_100%]" />
            </div>

            {actions.map((action, idx) => {
              const start = new Date(action.startDate).getTime();
              const end = new Date(action.endDate).getTime();
              const left = ((start - range.min) / range.span) * 100;
              const width = ((end - start) / range.span) * 100;
              const color = BAR_COLORS[idx % BAR_COLORS.length];
              const title = action.title;
              const tooltip = `${title} — ${format(new Date(action.startDate), "dd/MM HH:mm", { locale: fr })} - ${format(new Date(action.endDate), "dd/MM HH:mm", { locale: fr })}`;

              return (
                <div key={action.id} className="relative">
                  <div className="space-y-1.5 sm:hidden">
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                        <span
                          className={cn("mr-2 inline-block size-2 rounded-full", color)}
                          aria-hidden
                        />
                        {title}
                      </p>
                      <span className="shrink-0 text-[10px] text-slate-500">
                        {formatDuration(new Date(action.startDate), new Date(action.endDate))}
                      </span>
                    </div>
                    <div className="relative h-8 overflow-hidden rounded-lg bg-slate-100/80">
                      <div
                        className={cn("absolute inset-y-1 rounded-md opacity-90 shadow-sm", color)}
                        style={{
                          left: `${Math.max(0, left)}%`,
                          width: `${Math.max(2, Math.min(100 - left, width))}%`,
                        }}
                        title={tooltip}
                      />
                    </div>
                  </div>

                  <div className="hidden items-center gap-3 sm:flex">
                    <p className="w-36 shrink-0 truncate text-sm text-slate-700 lg:w-44 xl:w-52">
                      <span
                        className={cn("mr-2 inline-block size-2 rounded-full", color)}
                        aria-hidden
                      />
                      {title}
                    </p>
                    <div className="relative h-9 min-w-0 flex-1 overflow-hidden rounded-lg bg-slate-100/70">
                      <div
                        className={cn(
                          "absolute top-1.5 bottom-1.5 rounded-md opacity-90 shadow-sm transition-opacity hover:opacity-100",
                          color
                        )}
                        style={{
                          left: `${Math.max(0, left)}%`,
                          width: `${Math.max(0.8, Math.min(100 - left, width))}%`,
                        }}
                        title={tooltip}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {actions.map((action, idx) => (
          <div
            key={action.id}
            className="flex max-w-full items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50/80 px-2 py-1"
          >
            <div
              className={cn("size-2.5 shrink-0 rounded", BAR_COLORS[idx % BAR_COLORS.length])}
            />
            <span className="truncate text-xs text-slate-700 sm:max-w-[10rem]">{action.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
