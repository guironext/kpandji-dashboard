"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ObjectifGlobalItem } from "@/lib/actions/communication-objectifs";
import { getObjectifsForClerkUser } from "@/lib/actions/communication-objectifs";
import type { ObjectifGlobalTaskWithContext } from "@/lib/actions/objectif-global-task";
import {
  getAllTasksForClerkUser,
  getTasksByPublicationId,
  saveTasksForPublication,
  updateObjectifGlobalTaskStage,
  updateTasksForPublication,
} from "@/lib/actions/objectif-global-task";
import type { TaskStageId } from "@/lib/plan-action-task-stage";
import type { PublicationWithObjectifContext } from "@/lib/actions/publication-objectif-global-rubrique";
import {
  createPublicationForObjectif,
  getPublicationsByObjectifId,
  getPublicationsForClerkUser,
  updatePublicationForObjectif,
} from "@/lib/actions/publication-objectif-global-rubrique";
import ObjectifTasksGanttChart from "./ObjectifTasksGanttChart";
import { toast } from "sonner";
import {
  Target,
  ListTodo,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  ClipboardList,
  Sparkles,
  Palette,
  ChevronRight,
  Layers,
  Newspaper,
} from "lucide-react";

type TabId = "objectifs" | "publication" | "taches";

type TaskDraft = {
  key: string;
  id?: string;
  title: string;
  startDate: string;
  endDate: string;
  stage: TaskStageId;
};

const TABS: {
  id: TabId;
  label: string;
  description: string;
  icon: typeof Target;
  gradient: string;
  inactiveBg: string;
  inactiveBorder: string;
  inactiveText: string;
  shadow: string;
}[] = [
  {
    id: "objectifs",
    label: "Objectifs principaux",
    description: "Objectifs qui vous sont assignés",
    icon: Target,
    gradient: "from-violet-500 via-purple-500 to-fuchsia-600",
    inactiveBg: "bg-violet-50",
    inactiveBorder: "border-violet-200",
    inactiveText: "text-violet-700",
    shadow: "shadow-violet-500/25",
  },
  {
    id: "publication",
    label: "Publication",
    description: "Planifiez et suivez vos publications",
    icon: Newspaper,
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    inactiveBg: "bg-emerald-50",
    inactiveBorder: "border-emerald-200",
    inactiveText: "text-emerald-700",
    shadow: "shadow-emerald-500/25",
  },
  {
    id: "taches",
    label: "Tâches",
    description: "Diagramme de Gantt et étapes",
    icon: ListTodo,
    gradient: "from-sky-500 via-cyan-500 to-blue-600",
    inactiveBg: "bg-sky-50",
    inactiveBorder: "border-sky-200",
    inactiveText: "text-sky-700",
    shadow: "shadow-sky-500/25",
  },
];

const TAB_PANEL_STYLES: Record<
  TabId,
  { border: string; headerGradient: string; ring: string }
> = {
  objectifs: {
    border: "border-violet-200/60",
    headerGradient: "from-violet-500/10 via-purple-500/5 to-fuchsia-500/5",
    ring: "ring-violet-500/20",
  },
  publication: {
    border: "border-emerald-200/60",
    headerGradient: "from-emerald-500/10 via-teal-500/5 to-cyan-500/5",
    ring: "ring-emerald-500/20",
  },
  taches: {
    border: "border-sky-200/60",
    headerGradient: "from-sky-500/10 via-cyan-500/5 to-blue-500/5",
    ring: "ring-sky-500/20",
  },
};

function toDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fromDateInput(s: string): Date {
  return new Date(`${s}T12:00:00`);
}

function newTaskDraft(stage: TaskStageId = "EN_ATTENTE_DEBUT"): TaskDraft {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 7);
  return {
    key: crypto.randomUUID(),
    title: "",
    startDate: toDateInput(start),
    endDate: toDateInput(end),
    stage,
  };
}

function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: typeof Target;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50/80 to-white px-6 py-14 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon className="h-7 w-7" />
      </div>
      <p className="text-base font-semibold text-slate-800">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}

export default function InfographieObjectifsClient() {
  const { userId: clerkId, isLoaded: authLoaded } = useAuth();
  const [objectifs, setObjectifs] = useState<ObjectifGlobalItem[]>([]);
  const [allTasks, setAllTasks] = useState<ObjectifGlobalTaskWithContext[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("objectifs");
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const [publications, setPublications] = useState<PublicationWithObjectifContext[]>([]);

  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [selectedObjectif, setSelectedObjectif] = useState<ObjectifGlobalItem | null>(null);
  const [selectedPublication, setSelectedPublication] =
    useState<PublicationWithObjectifContext | null>(null);
  const [taskDrafts, setTaskDrafts] = useState<TaskDraft[]>([]);
  const [loadingPlanDialog, setLoadingPlanDialog] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [updatingPlan, setUpdatingPlan] = useState(false);

  const [publicationDialogOpen, setPublicationDialogOpen] = useState(false);
  const [publicationId, setPublicationId] = useState<string | null>(null);
  const [publicationTitre, setPublicationTitre] = useState("");
  const [publicationDateDebut, setPublicationDateDebut] = useState("");
  const [publicationDateFin, setPublicationDateFin] = useState("");
  const [loadingPublicationDialog, setLoadingPublicationDialog] = useState(false);
  const [savingPublication, setSavingPublication] = useState(false);

  const activeTabConfig = TABS.find((t) => t.id === activeTab)!;
  const panelStyles = TAB_PANEL_STYLES[activeTab];

  const refreshAllTasks = useCallback(async () => {
    if (!clerkId) return;
    const tasksRes = await getAllTasksForClerkUser(clerkId);
    if (tasksRes.success) setAllTasks(tasksRes.tasks);
  }, [clerkId]);

  const refreshPublications = useCallback(async () => {
    if (!clerkId) return;
    const res = await getPublicationsForClerkUser(clerkId);
    if (res.success) setPublications(res.publications);
  }, [clerkId]);

  useEffect(() => {
    if (!authLoaded) return;

    if (!clerkId) {
      setLoadError("Vous devez être connecté.");
      setLoadingInitial(false);
      setObjectifs([]);
      setAllTasks([]);
      return;
    }

    let cancelled = false;
    setLoadingInitial(true);
    setLoadError(null);

    (async () => {
      const objectifsResult = await getObjectifsForClerkUser(clerkId);
      if (cancelled) return;

      if (!objectifsResult.success) {
        setLoadError(objectifsResult.error);
        setObjectifs([]);
        setAllTasks([]);
        setLoadingInitial(false);
        return;
      }

      setObjectifs(objectifsResult.data.objectifs);

      const tasksRes = await getAllTasksForClerkUser(clerkId);
      if (cancelled) return;
      setAllTasks(tasksRes.success ? tasksRes.tasks : []);
      if (!tasksRes.success) toast.error(tasksRes.error);

      const pubsRes = await getPublicationsForClerkUser(clerkId);
      if (!cancelled) setPublications(pubsRes.success ? pubsRes.publications : []);

      setLoadingInitial(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoaded, clerkId]);

  useEffect(() => {
    if (activeTab !== "taches" || !authLoaded || !clerkId || loadingInitial) return;
    void refreshAllTasks();
  }, [activeTab, authLoaded, clerkId, loadingInitial, refreshAllTasks]);

  useEffect(() => {
    if (activeTab !== "publication" || !authLoaded || !clerkId || loadingInitial) return;
    void refreshPublications();
  }, [activeTab, authLoaded, clerkId, loadingInitial, refreshPublications]);

  const mapTasksToDrafts = (
    tasks: { id: string; title: string; startDate: Date; endDate: Date; stage: TaskStageId }[]
  ) =>
    tasks.map((t) => ({
      key: t.id,
      id: t.id,
      title: t.title,
      startDate: toDateInput(new Date(t.startDate)),
      endDate: toDateInput(new Date(t.endDate)),
      stage: t.stage ?? "EN_ATTENTE_DEBUT",
    }));

  const resetPublicationForm = (objectif?: ObjectifGlobalItem | null) => {
    setPublicationId(null);
    setPublicationTitre("");
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 7);
    setPublicationDateDebut(toDateInput(start));
    setPublicationDateFin(toDateInput(end));
    if (objectif?.objectif) {
      setPublicationTitre(`Publication — ${objectif.objectif.slice(0, 60)}`);
    }
  };

  const openPublicationDialog = async (objectif: ObjectifGlobalItem) => {
    setSelectedObjectif(objectif);
    resetPublicationForm(objectif);
    setPublicationDialogOpen(true);
    setLoadingPublicationDialog(true);
    try {
      const res = await getPublicationsByObjectifId(objectif.id);
      if (res.success && res.publications.length > 0) {
        const latest = res.publications[res.publications.length - 1];
        setPublicationId(latest.id);
        setPublicationTitre(latest.titrePublication);
        setPublicationDateDebut(toDateInput(new Date(latest.dateDebutPublication)));
        setPublicationDateFin(toDateInput(new Date(latest.dateFinPublication)));
      }
    } catch {
      resetPublicationForm(objectif);
    } finally {
      setLoadingPublicationDialog(false);
    }
  };

  const handleSavePublication = async () => {
    if (!clerkId || !selectedObjectif) return;

    const titre = publicationTitre.trim();
    if (!titre) {
      toast.error("Le titre de la publication est obligatoire.");
      return;
    }
    if (!publicationDateDebut || !publicationDateFin) {
      toast.error("Renseignez les dates de publication.");
      return;
    }

    const dateDebut = fromDateInput(publicationDateDebut);
    const dateFin = fromDateInput(publicationDateFin);
    if (dateFin < dateDebut) {
      toast.error("La date de fin doit être après la date de début.");
      return;
    }

    setSavingPublication(true);
    const input = {
      titrePublication: titre,
      dateDebutPublication: dateDebut,
      dateFinPublication: dateFin,
      rubriqueObjectifGlobalId: selectedObjectif.rubriqueId ?? null,
      cycleObjectifGlobalRubriqueId: selectedObjectif.cycleObjectifGlobalRubriqueId ?? null,
    };

    const res = publicationId
      ? await updatePublicationForObjectif(publicationId, clerkId, input)
      : await createPublicationForObjectif(clerkId, selectedObjectif.id, input);

    setSavingPublication(false);

    if (!res.success) {
      toast.error(res.error);
      return;
    }

    toast.success(publicationId ? "Publication mise à jour." : "Publication enregistrée.");
    setPublicationId(res.publication.id);
    setPublicationDialogOpen(false);
    await refreshPublications();
  };

  const openPlanDialogForPublication = async (pub: PublicationWithObjectifContext) => {
    const objectif =
      objectifs.find((o) => o.id === pub.objectifGlobalId) ??
      ({
        id: pub.objectifGlobalId,
        objectif: pub.objectifTitle,
        frequence: "",
        plateforme: "",
        style_Thon: "",
        rubrique: pub.rubrique,
      } satisfies ObjectifGlobalItem);

    setSelectedObjectif(objectif);
    setSelectedPublication(pub);
    setTaskDrafts([]);
    setPlanDialogOpen(true);
    setLoadingPlanDialog(true);
    try {
      const res = await getTasksByPublicationId(pub.id);
      if (res.success && res.tasks.length > 0) {
        setTaskDrafts(mapTasksToDrafts(res.tasks));
      } else {
        const start = toDateInput(new Date(pub.dateDebutPublication));
        const end = toDateInput(new Date(pub.dateFinPublication));
        setTaskDrafts([{ ...newTaskDraft(), startDate: start, endDate: end }]);
      }
    } catch {
      setTaskDrafts([newTaskDraft()]);
    } finally {
      setLoadingPlanDialog(false);
    }
  };

  const buildTaskPayload = () => {
    if (!selectedObjectif) return null;
    const payload = taskDrafts.filter((t) => t.title.trim());
    if (payload.length === 0) {
      toast.error("Ajoutez au moins une tâche avec un titre.");
      return null;
    }
    for (const t of payload) {
      if (!t.startDate || !t.endDate) {
        toast.error("Renseignez les dates pour chaque tâche.");
        return null;
      }
      const start = fromDateInput(t.startDate);
      const end = fromDateInput(t.endDate);
      if (end < start) {
        toast.error("La date de fin doit être après la date de début.");
        return null;
      }
    }
    return payload.map((t, index) => ({
      id: t.id,
      title: t.title.trim(),
      startDate: fromDateInput(t.startDate),
      endDate: fromDateInput(t.endDate),
      stage: t.stage,
      orderIndex: index,
    }));
  };

  const handleSavePlan = async () => {
    const payload = buildTaskPayload();
    if (!payload || !selectedObjectif || !selectedPublication) return;

    setSavingPlan(true);
    const res = await saveTasksForPublication(
      selectedObjectif.id,
      selectedPublication.id,
      payload
    );
    setSavingPlan(false);

    if (!res.success) {
      toast.error(res.error);
      return;
    }

    toast.success("Plan d'action enregistré.");
    setPlanDialogOpen(false);
    await refreshAllTasks();
  };

  const handleUpdatePlan = async () => {
    const payload = buildTaskPayload();
    if (!payload || !selectedObjectif || !selectedPublication) return;

    setUpdatingPlan(true);
    const res = await updateTasksForPublication(
      selectedObjectif.id,
      selectedPublication.id,
      payload
    );
    setUpdatingPlan(false);

    if (!res.success) {
      toast.error(res.error);
      return;
    }

    setTaskDrafts(mapTasksToDrafts(res.tasks));
    toast.success("Tâches mises à jour.");
    await refreshAllTasks();
  };

  const handleTaskStageChange = async (taskId: string, stage: TaskStageId) => {
    setUpdatingTaskId(taskId);
    const res = await updateObjectifGlobalTaskStage(taskId, stage);
    setUpdatingTaskId(null);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    setAllTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, stage: res.task.stage } : t))
    );
    toast.success("Étape mise à jour.");
  };

  if (!authLoaded || loadingInitial) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          <p className="text-sm text-slate-500">Chargement…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8">
        <div className="max-w-md rounded-2xl border border-red-200/80 bg-gradient-to-b from-red-50 to-white p-8 shadow-lg shadow-red-100/50 ring-1 ring-red-100">
          <h2 className="text-lg font-bold text-red-800">Erreur</h2>
          <p className="mt-2 text-sm leading-relaxed text-red-700">{loadError}</p>
          {loadError.includes("connecté") && (
            <p className="mt-3 text-xs text-red-600">
              Reconnectez-vous via la page de connexion, puis rechargez cette page.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
      <section className="relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-purple-700 px-4 pb-8 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_45%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl sm:h-64 sm:w-64"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-8 bottom-0 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-2xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm ring-1 ring-white/20">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  Infographie
                </span>
                <Badge className="border-0 bg-white/20 text-white hover:bg-white/25">
                  <Palette className="mr-1 h-3 w-3" />
                  Mes objectifs
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                Objectifs principaux
              </h1>
              <p className="max-w-2xl text-sm text-white/90 sm:text-base">
                Objectifs qui vous ont été assignés par l&apos;équipe communication. Définissez vos
                plans d&apos;action et suivez vos tâches.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:max-w-xs lg:shrink-0">
              {[
                { label: "Objectifs", value: objectifs.length },
                { label: "Tâches", value: allTasks.length },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm ring-1 ring-white/20"
                >
                  <p className="text-xs font-medium text-violet-100/80">{stat.label}</p>
                  <p className="mt-0.5 text-2xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-0">
        <div
          className="pointer-events-none absolute -left-20 top-8 h-64 w-64 rounded-full bg-violet-300/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-10 top-32 h-56 w-56 rounded-full bg-fuchsia-300/15 blur-3xl"
          aria-hidden
        />

        <div className="relative space-y-5 sm:space-y-6">
          <div className="md:hidden">
            <label
              htmlFor="objectifs-tab-select"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              Section active
            </label>
            <Select value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
              <SelectTrigger
                id="objectifs-tab-select"
                className="h-12 w-full rounded-xl border-slate-200 bg-white shadow-sm"
              >
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <activeTabConfig.icon className="h-4 w-4 text-slate-600" />
                    {activeTabConfig.label}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <SelectItem key={tab.id} value={tab.id}>
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <nav className="hidden md:block" aria-label="Sections">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-slate-50 to-transparent lg:hidden" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-slate-50 to-transparent lg:hidden" />
              <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:overflow-visible">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group relative flex min-w-[9.5rem] shrink-0 snap-start flex-col gap-1 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 lg:min-w-0 lg:flex-1",
                        isActive
                          ? cn(
                              "border-transparent bg-gradient-to-br text-white shadow-lg",
                              tab.gradient,
                              tab.shadow
                            )
                          : cn(
                              "border bg-white hover:-translate-y-0.5 hover:shadow-md",
                              tab.inactiveBorder,
                              tab.inactiveBg
                            )
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                            isActive ? "bg-white/20" : cn(tab.inactiveBg, tab.inactiveText)
                          )}
                        >
                          <Icon className={cn("h-4 w-4", isActive ? "text-white" : "")} />
                        </div>
                        <span
                          className={cn(
                            "text-sm font-semibold leading-tight",
                            isActive ? "text-white" : tab.inactiveText
                          )}
                        >
                          {tab.label}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "pl-11 text-xs leading-snug",
                          isActive ? "text-white/80" : "text-slate-500"
                        )}
                      >
                        {tab.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>

          <article
            className={cn(
              "overflow-hidden rounded-2xl border bg-white shadow-lg shadow-slate-200/40 ring-1",
              panelStyles.border,
              panelStyles.ring
            )}
          >
            <header
              className={cn(
                "flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5",
                panelStyles.headerGradient
              )}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md sm:h-12 sm:w-12 sm:rounded-2xl",
                    activeTabConfig.gradient
                  )}
                >
                  <activeTabConfig.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                    {activeTabConfig.label}
                  </h2>
                  <p className="text-sm text-slate-600">{activeTabConfig.description}</p>
                </div>
              </div>
              <div className="hidden items-center gap-1.5 text-sm font-medium text-slate-500 sm:flex">
                <Layers className="h-4 w-4" />
                <span>
                  {activeTab === "objectifs" &&
                    `${objectifs.length} objectif${objectifs.length !== 1 ? "s" : ""}`}
                  {activeTab === "publication" && "Publications"}
                  {activeTab === "taches" &&
                    `${allTasks.length} tâche${allTasks.length !== 1 ? "s" : ""}`}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
            </header>

            <div className="min-h-[min(60vh,520px)] bg-gradient-to-b from-white to-slate-50/40 p-4 sm:p-6">
              {activeTab === "objectifs" && (
                <div className="animate-in fade-in duration-300">
                  {objectifs.length === 0 ? (
                    <EmptyState
                      icon={Target}
                      title="Aucun objectif"
                      description="Aucun objectif ne vous a encore été assigné par l'équipe communication."
                    />
                  ) : (
                    <ul className="space-y-3">
                      {objectifs.map((objectif) => (
                        <li
                          key={objectif.id}
                          className="group flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-violet-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{objectif.rubrique}</Badge>
                              {objectif.createdAt && (
                                <span className="text-xs text-slate-400">
                                  Assigné le{" "}
                                  {format(new Date(objectif.createdAt), "dd MMM yyyy", {
                                    locale: fr,
                                  })}
                                </span>
                              )}
                            </div>
                            <p className="font-semibold text-slate-900 group-hover:text-violet-900">
                              {objectif.objectif}
                            </p>
                            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                              {objectif.frequence && (
                                <span>
                                  <span className="font-medium text-slate-600">Fréquence :</span>{" "}
                                  {objectif.frequence}
                                </span>
                              )}
                              {objectif.plateforme && (
                                <span>
                                  <span className="font-medium text-slate-600">Plateforme :</span>{" "}
                                  {objectif.plateforme}
                                </span>
                              )}
                              {objectif.style_Thon && (
                                <span>
                                  <span className="font-medium text-slate-600">Style / Ton :</span>{" "}
                                  {objectif.style_Thon}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            className="shrink-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-md shadow-violet-500/20 hover:from-violet-700 hover:to-fuchsia-700"
                            onClick={() => openPublicationDialog(objectif)}
                          >
                            <Newspaper className="mr-2 h-4 w-4" />
                            Définir une publication
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {activeTab === "publication" && (
                <div className="animate-in fade-in duration-300">
                  {publications.length === 0 ? (
                    <EmptyState
                      icon={Newspaper}
                      title="Aucune publication"
                      description="Définissez une publication depuis l'onglet Objectifs principaux."
                    />
                  ) : (
                    <ul className="space-y-3">
                      {publications.map((pub) => (
                        <li
                          key={pub.id}
                          className="flex flex-col gap-4 rounded-2xl border border-emerald-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="border-emerald-200 text-emerald-800">
                                {pub.rubrique || "Rubrique"}
                              </Badge>
                              <Badge
                                variant={pub.status === "ACTIVE" ? "default" : "secondary"}
                                className={
                                  pub.status === "ACTIVE"
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : ""
                                }
                              >
                                {pub.status === "ACTIVE" ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="mt-2 font-semibold text-slate-900">{pub.titrePublication}</p>
                            <p className="mt-1 text-sm text-slate-600">{pub.objectifTitle}</p>
                            <p className="mt-2 text-xs text-slate-500">
                              Du{" "}
                              {format(new Date(pub.dateDebutPublication), "dd MMM yyyy", {
                                locale: fr,
                              })}{" "}
                              au{" "}
                              {format(new Date(pub.dateFinPublication), "dd MMM yyyy", {
                                locale: fr,
                              })}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="shrink-0 border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                            onClick={() => openPlanDialogForPublication(pub)}
                          >
                            <ClipboardList className="mr-2 h-4 w-4" />
                            Plan d&apos;action
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {activeTab === "taches" && (
                <div className="animate-in fade-in duration-300">
                  {allTasks.length === 0 ? (
                    <EmptyState
                      icon={ListTodo}
                      title="Aucune tâche"
                      description="Définissez des tâches depuis l'onglet Publication en ouvrant un plan d'action."
                    />
                  ) : (
                    <ObjectifTasksGanttChart
                      tasks={allTasks}
                      onStageChange={handleTaskStageChange}
                      updatingTaskId={updatingTaskId}
                    />
                  )}
                </div>
              )}
            </div>
          </article>
        </div>
      </div>

      <Dialog open={publicationDialogOpen} onOpenChange={setPublicationDialogOpen}>
        <DialogContent className="flex min-h-0 w-[calc(100%-2rem)] max-w-lg max-h-[min(90dvh,calc(100dvh-1.5rem))] flex-col gap-0 overflow-hidden border-emerald-200/60 p-0 [&_[data-slot=dialog-close]]:z-10 [&_[data-slot=dialog-close]]:top-3.5 [&_[data-slot=dialog-close]]:right-3.5 [&_[data-slot=dialog-close]]:rounded-lg [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:opacity-90 [&_[data-slot=dialog-close]]:hover:bg-white/15 [&_[data-slot=dialog-close]]:hover:opacity-100">
          <div className="shrink-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-6 py-5 pr-12 text-white">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-lg font-bold text-white">
                Publication
              </DialogTitle>
              <DialogDescription className="text-white/85">
                {selectedObjectif
                  ? `Planifier une publication pour « ${selectedObjectif.objectif} »`
                  : "Renseignez les informations de publication."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-6 py-4 [scrollbar-gutter:stable]">
              {loadingPublicationDialog ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  <p className="text-sm text-slate-500">Chargement…</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="publication-titre">Titre de la publication</Label>
                    <Input
                      id="publication-titre"
                      className="rounded-xl border-slate-200"
                      value={publicationTitre}
                      onChange={(e) => setPublicationTitre(e.target.value)}
                      placeholder="Ex. Visuel Instagram — lancement produit"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="publication-debut">Date de début</Label>
                      <Input
                        id="publication-debut"
                        type="date"
                        className="rounded-xl border-slate-200"
                        value={publicationDateDebut}
                        onChange={(e) => setPublicationDateDebut(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="publication-fin">Date de fin</Label>
                      <Input
                        id="publication-fin"
                        type="date"
                        className="rounded-xl border-slate-200"
                        value={publicationDateFin}
                        onChange={(e) => setPublicationDateFin(e.target.value)}
                      />
                    </div>
                  </div>
                  {selectedObjectif && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2 text-xs text-slate-600">
                      <p>
                        <span className="font-medium text-slate-700">Objectif :</span>{" "}
                        {selectedObjectif.objectif}
                      </p>
                      {selectedObjectif.rubrique && (
                        <p className="mt-1">
                          <span className="font-medium text-slate-700">Rubrique :</span>{" "}
                          {selectedObjectif.rubrique}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="shrink-0 flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPublicationDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                disabled={savingPublication || loadingPublicationDialog}
                onClick={handleSavePublication}
              >
                {savingPublication ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement…
                  </>
                ) : publicationId ? (
                  "Mettre à jour"
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={planDialogOpen}
        onOpenChange={(open) => {
          setPlanDialogOpen(open);
          if (!open) setSelectedPublication(null);
        }}
      >
        <DialogContent className="flex min-h-0 w-[calc(100%-2rem)] max-w-lg max-h-[min(90dvh,calc(100dvh-1.5rem))] flex-col gap-0 overflow-hidden border-violet-200/60 p-0 [&_[data-slot=dialog-close]]:z-10 [&_[data-slot=dialog-close]]:top-3.5 [&_[data-slot=dialog-close]]:right-3.5 [&_[data-slot=dialog-close]]:rounded-lg [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:opacity-90 [&_[data-slot=dialog-close]]:hover:bg-white/15 [&_[data-slot=dialog-close]]:hover:opacity-100">
          <div className="shrink-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-purple-700 px-6 py-5 pr-12 text-white">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-lg font-bold text-white">
                Plan d&apos;action
              </DialogTitle>
              <DialogDescription className="text-white/85">
                {selectedPublication
                  ? `Tâches pour la publication « ${selectedPublication.titrePublication} »`
                  : selectedObjectif
                    ? `Tâches pour « ${selectedObjectif.objectif} »`
                    : "Définissez les tâches de cette publication."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-6 py-4 [scrollbar-gutter:stable]">
              {loadingPlanDialog ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                  <p className="text-sm text-slate-500">Chargement…</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {taskDrafts.map((task, index) => (
                    <div
                      key={task.key}
                      className="space-y-3 rounded-2xl border border-violet-100 bg-gradient-to-b from-violet-50/50 to-white p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                          <ListTodo className="h-3 w-3" />
                          Tâche {index + 1}
                        </span>
                        {taskDrafts.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() =>
                              setTaskDrafts((prev) => prev.filter((t) => t.key !== task.key))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`task-title-${task.key}`}>Tâche</Label>
                        <Input
                          id={`task-title-${task.key}`}
                          className="rounded-xl border-slate-200"
                          value={task.title}
                          onChange={(e) =>
                            setTaskDrafts((prev) =>
                              prev.map((t) =>
                                t.key === task.key ? { ...t, title: e.target.value } : t
                              )
                            )
                          }
                          placeholder="Ex. Création visuelle"
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`task-start-${task.key}`}>Début</Label>
                          <Input
                            id={`task-start-${task.key}`}
                            type="date"
                            className="rounded-xl border-slate-200"
                            value={task.startDate}
                            onChange={(e) =>
                              setTaskDrafts((prev) =>
                                prev.map((t) =>
                                  t.key === task.key ? { ...t, startDate: e.target.value } : t
                                )
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`task-end-${task.key}`}>Fin de tâche</Label>
                          <Input
                            id={`task-end-${task.key}`}
                            type="date"
                            className="rounded-xl border-slate-200"
                            value={task.endDate}
                            onChange={(e) =>
                              setTaskDrafts((prev) =>
                                prev.map((t) =>
                                  t.key === task.key ? { ...t, endDate: e.target.value } : t
                                )
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl border-dashed border-violet-300 text-violet-700 hover:bg-violet-50"
                    onClick={() => setTaskDrafts((prev) => [...prev, newTaskDraft()])}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter une tâche
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter className="shrink-0 flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setPlanDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-violet-200 text-violet-700 hover:bg-violet-50"
                disabled={savingPlan || updatingPlan || loadingPlanDialog}
                onClick={handleSavePlan}
              >
                {savingPlan ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  "Valider"
                )}
              </Button>
              <Button
                type="button"
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                disabled={savingPlan || updatingPlan || loadingPlanDialog}
                onClick={handleUpdatePlan}
              >
                {updatingPlan ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mise à jour…
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Mettre à jour
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
