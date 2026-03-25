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
} from "lucide-react";
import { format, addDays } from "date-fns";
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

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(s: string): Date {
  return new Date(s);
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
  };

  const handleEdit = (action: PlanActionItem) => {
    setForm({
      title: action.title,
      startDate: toDatetimeLocal(new Date(action.startDate)),
      endDate: toDatetimeLocal(new Date(action.endDate)),
    });
    setEditingId(action.id);
    setIsAdding(false);
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

  // Timeline chart: range = min start to max end across all actions
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

  return (
    <div className={cn("space-y-8", embedded ? "p-4 sm:p-6" : "p-6")}>
      {!embedded && (
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
                Planning & exécution
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-sm">
                  <GanttChart className="size-5" />
                </span>
                Plan d&apos;action
              </h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Sélectionnez un projet existant, décrivez chaque action, puis définissez sa{" "}
                <span className="font-medium text-slate-700">date de début</span> et{" "}
                <span className="font-medium text-slate-700">date de fin</span>. Le diagramme vous montre
                instantanément la durée de chaque action.
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
      )}

      <Card className="bg-white/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Projet
          </CardTitle>
          <CardDescription>
            Sélectionnez le projet pour lequel vous souhaitez planifier les actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-slate-50 p-5 text-slate-600">
              <div className="font-medium text-slate-800">Aucun projet trouvé.</div>
              <div className="mt-1 text-sm">
                Créez d&apos;abord un projet dans <span className="font-medium">Communication → Projets</span>,
                puis revenez ici pour planifier les actions.
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-1">
                <Select
                  value={selectedProjectId ?? ""}
                  onValueChange={(v) => setSelectedProjectId(v || null)}
                >
                  <SelectTrigger className="w-full lg:max-w-xl">
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

                {selectedProjectId && (
                  <div className="relative w-full lg:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Rechercher une action…"
                      className="pl-9 bg-white/70"
                    />
                  </div>
                )}
              </div>

              {selectedProjectId && (
                <Button
                  onClick={handleAdd}
                  className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
                >
                  <Plus className="size-4" />
                  Nouvelle action
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedProjectId && (
        <>
          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2 bg-white/70 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="size-5" />
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
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center gap-2 text-muted-foreground py-8">
                    <Loader2 className="size-5 animate-spin" />
                    Chargement des actions...
                  </div>
                ) : (
                  <>
                    {actions.length === 0 && !isAdding ? (
                      <div className="rounded-xl border border-dashed bg-gradient-to-br from-violet-50/70 to-cyan-50/70 p-6">
                        <div className="flex flex-col gap-2">
                          <div className="font-medium text-slate-900">Commencez votre planning.</div>
                          <div className="text-sm text-slate-600">
                            Ajoutez la première action, puis visualisez sa durée dans le diagramme.
                          </div>
                          <Button
                            onClick={handleAdd}
                            className="mt-2 w-fit gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
                          >
                            <Plus className="size-4" />
                            Ajouter une action
                            <ArrowRight className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    <ul className="space-y-3">
                      {filteredActions.map((action, idx) => (
                        <li
                          key={action.id}
                          className="group flex flex-wrap items-center gap-3 rounded-xl border bg-white/70 p-3 shadow-sm transition hover:bg-white hover:shadow-md"
                        >
                          {editingId === action.id ? (
                            <ActionFormFields
                              form={form}
                              setForm={setForm}
                              onSave={handleSaveEdit}
                              onCancel={resetForm}
                              saveLabel="Enregistrer"
                            />
                          ) : (
                            <>
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div
                                  className={`size-3 rounded-full ${BAR_COLORS[idx % BAR_COLORS.length]} shadow-sm`}
                                  aria-hidden
                                />
                                <div className="min-w-0">
                                  <div className="font-medium text-slate-900 truncate">
                                    {action.title}
                                  </div>
                                  <div className="text-xs text-slate-600 mt-0.5">
                                    {format(new Date(action.startDate), "dd MMM yyyy, HH:mm", {
                                      locale: fr,
                                    })}{" "}
                                    <span className="text-slate-400">→</span>{" "}
                                    {format(new Date(action.endDate), "dd MMM yyyy, HH:mm", {
                                      locale: fr,
                                    })}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(action)}
                                >
                                  Modifier
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDelete(action.id)}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>

                    {isAdding ? (
                      <div className="rounded-xl border border-dashed border-violet-300 bg-gradient-to-br from-violet-50/70 to-fuchsia-50/40 p-4">
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
                      <div className="rounded-xl border border-dashed bg-slate-50 p-5 text-slate-600">
                        <div className="font-medium text-slate-800">Aucun résultat.</div>
                        <div className="mt-1 text-sm">
                          Essayez un autre mot-clé dans la recherche.
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 bg-white/70 backdrop-blur lg:sticky lg:top-6 h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GanttChart className="size-5 text-violet-700" />
                  Diagramme (Gantt)
                </CardTitle>
                <CardDescription>
                  Durée et position des actions sur la période du projet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {actions.length > 0 && chartRange ? (
                  <TimeChart actions={actions} range={chartRange} />
                ) : (
                  <div className="rounded-xl border border-dashed bg-gradient-to-br from-slate-50 to-violet-50 p-6 text-slate-600">
                    <div className="font-medium text-slate-900">Votre diagramme apparaîtra ici.</div>
                    <div className="mt-1 text-sm">
                      Ajoutez au moins une action avec une date de début et de fin.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
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
    <div className="flex flex-wrap items-end gap-3 w-full">
      <div className="flex-1 min-w-[200px]">
        <Label>Intitulé</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Ex. Lancement campagne réseaux sociaux"
          className="mt-1"
        />
      </div>
      <div className="min-w-[180px]">
        <Label>Début</Label>
        <Input
          type="datetime-local"
          value={form.startDate}
          onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
          className="mt-1"
        />
      </div>
      <div className="min-w-[180px]">
        <Label>Fin</Label>
        <Input
          type="datetime-local"
          value={form.endDate}
          onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
          className="mt-1"
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onSave}
          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
        >
          {saveLabel}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Annuler
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
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600 mb-3">
        <div>
          <span className="font-medium text-slate-700">Période</span> :{" "}
          {format(minDate, "dd MMM yyyy, HH:mm", { locale: fr })}{" "}
          <span className="text-slate-400">→</span>{" "}
          {format(maxDate, "dd MMM yyyy, HH:mm", { locale: fr })}
        </div>
        <div className="text-xs text-slate-500">
          Astuce : survolez une barre pour voir les détails.
        </div>
      </div>

      <div className="rounded-xl border bg-white/70 p-4 shadow-sm">
        <div className="relative">
          {/* grid */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="h-full w-full rounded-lg bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:20%_100%]" />
          </div>

          {/* tick labels */}
          <div className="relative mb-3 grid grid-cols-6 gap-2 text-[11px] text-slate-500">
            {tickDates.map((d, i) => (
              <div key={i} className={i === 0 ? "text-left" : i === ticks - 1 ? "text-right" : "text-center"}>
                {format(d, "dd MMM", { locale: fr })}
              </div>
            ))}
          </div>

          <div className="relative space-y-2">
            {actions.map((action, idx) => {
              const start = new Date(action.startDate).getTime();
              const end = new Date(action.endDate).getTime();
              const left = ((start - range.min) / range.span) * 100;
              const width = ((end - start) / range.span) * 100;
              const color = BAR_COLORS[idx % BAR_COLORS.length];

              return (
                <div key={action.id} className="flex items-center gap-3">
                  <div className="w-52 shrink-0 truncate text-sm text-slate-700">
                    <span className={`mr-2 inline-block size-2 rounded-full ${color}`} aria-hidden />
                    {action.title}
                  </div>
                  <div className="relative h-9 flex-1 rounded-lg bg-slate-100/70 overflow-hidden">
                    <div
                      className={`absolute top-1.5 bottom-1.5 rounded-md ${color} opacity-90 shadow-sm hover:opacity-100 transition-opacity`}
                      style={{
                        left: `${Math.max(0, left)}%`,
                        width: `${Math.max(0.8, Math.min(100 - left, width))}%`,
                      }}
                      title={`${action.title} — ${format(new Date(action.startDate), "dd/MM HH:mm", { locale: fr })} - ${format(new Date(action.endDate), "dd/MM HH:mm", { locale: fr })}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 mt-3">
        {actions.map((action, idx) => (
          <div key={action.id} className="flex items-center gap-2">
            <div
              className={`size-3 rounded ${BAR_COLORS[idx % BAR_COLORS.length]}`}
            />
            <span className="text-sm text-slate-700 truncate max-w-[200px]">
              {action.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
