"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ChevronDown,
  ClipboardList,
  FolderOpen,
  Layers,
  LayoutGrid,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Target,
  Trash2,
  UserCircle2,
  Users,
} from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type {
  ActeurWithObjectifs,
  ObjectifAssigneeUser,
  ObjectifGlobalItem,
  ObjectifsPrincipauxPageData,
  RubriqueItem,
} from "@/lib/actions/communication-objectifs";
import {
  createObjectifGlobalForUsers,
  createRubriqueObjectifGlobal,
  deleteObjectifGlobal,
  deleteRubriqueObjectifGlobal,
  getObjectifsPrincipauxPageData,
  updateObjectifGlobal,
  updateRubriqueObjectifGlobal,
} from "@/lib/actions/communication-objectifs";
import {
  getObjectifGlobalMiseEnOeuvreData,
  type ObjectifGlobalMiseEnOeuvreData,
} from "@/lib/actions/objectif-global-task";
import ObjectifsGlobalMiseEnOeuvrePanel from "./ObjectifsGlobalMiseEnOeuvrePanel";

type TabId = "rubriques" | "objectifs-principaux" | "acteurs" | "mise-en-oeuvre";

const TABS: {
  id: TabId;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof FolderOpen;
  gradient: string;
  shadow: string;
  inactiveBg: string;
  inactiveBorder: string;
  inactiveText: string;
  inactiveIcon: string;
}[] = [
  {
    id: "rubriques",
    label: "Rubriques",
    shortLabel: "Rubriques",
    description: "Catégories d'objectifs",
    icon: FolderOpen,
    gradient: "from-sky-500 via-cyan-500 to-teal-500",
    shadow: "shadow-sky-500/25",
    inactiveBg: "bg-sky-50/80",
    inactiveBorder: "border-sky-200/80",
    inactiveText: "text-sky-800",
    inactiveIcon: "bg-sky-100 text-sky-600",
  },
  {
    id: "objectifs-principaux",
    label: "Objectifs principaux",
    shortLabel: "Objectifs",
    description: "Définir et assigner",
    icon: Target,
    gradient: "from-violet-500 via-purple-500 to-fuchsia-600",
    shadow: "shadow-violet-500/25",
    inactiveBg: "bg-violet-50/80",
    inactiveBorder: "border-violet-200/80",
    inactiveText: "text-violet-800",
    inactiveIcon: "bg-violet-100 text-violet-600",
  },
  {
    id: "acteurs",
    label: "Acteurs et Opération",
    shortLabel: "Acteurs",
    description: "Vue par utilisateur",
    icon: Users,
    gradient: "from-emerald-500 via-green-500 to-teal-600",
    shadow: "shadow-emerald-500/25",
    inactiveBg: "bg-emerald-50/80",
    inactiveBorder: "border-emerald-200/80",
    inactiveText: "text-emerald-800",
    inactiveIcon: "bg-emerald-100 text-emerald-600",
  },
  {
    id: "mise-en-oeuvre",
    label: "Mise en Oeuvre",
    shortLabel: "Mise en œuvre",
    description: "Tâches en attente de validation",
    icon: ClipboardList,
    gradient: "from-amber-500 via-orange-500 to-rose-600",
    shadow: "shadow-amber-500/25",
    inactiveBg: "bg-amber-50/80",
    inactiveBorder: "border-amber-200/80",
    inactiveText: "text-amber-900",
    inactiveIcon: "bg-amber-100 text-amber-700",
  },
];

const TAB_PANEL_STYLES: Record<
  TabId,
  { ring: string; accent: string; button: string; badge: string }
> = {
  rubriques: {
    ring: "ring-sky-500/15",
    accent: "border-sky-200 bg-sky-50/50",
    button: "bg-sky-600 hover:bg-sky-700",
    badge: "bg-sky-100 text-sky-800 border-sky-200",
  },
  "objectifs-principaux": {
    ring: "ring-violet-500/15",
    accent: "border-violet-200 bg-violet-50/50",
    button: "bg-violet-600 hover:bg-violet-700",
    badge: "bg-violet-100 text-violet-800 border-violet-200",
  },
  acteurs: {
    ring: "ring-emerald-500/15",
    accent: "border-emerald-200 bg-emerald-50/50",
    button: "bg-emerald-600 hover:bg-emerald-700",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  "mise-en-oeuvre": {
    ring: "ring-amber-500/15",
    accent: "border-amber-200 bg-amber-50/50",
    button: "bg-amber-600 hover:bg-amber-700",
    badge: "bg-amber-100 text-amber-900 border-amber-200",
  },
};

const ROLE_LABELS: Record<string, string> = {
  COMMUNICATION: "Communication",
  INFOGRAPHIE: "Infographie",
  COMMERCIAL: "Commercial",
  COMMUNITY_MANAGER: "Community manager",
};

const AVATAR_GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-sky-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-indigo-500 to-blue-600",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof FolderOpen;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
        <Icon className="h-7 w-7 text-slate-400" />
      </div>
      <p className="text-base font-semibold text-slate-800">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function GlassCard({
  children,
  className,
  ringClass,
}: {
  children: React.ReactNode;
  className?: string;
  ringClass?: string;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-sm ring-1",
        ringClass ?? "ring-slate-100",
        className
      )}
    >
      {children}
    </Card>
  );
}

type Props = {
  initialData: ObjectifsPrincipauxPageData;
};

export default function ObjectifsPrincipauxPageClient({ initialData }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("rubriques");
  const [rubriques, setRubriques] = useState<RubriqueItem[]>(initialData.rubriques);
  const [objectifs, setObjectifs] = useState<ObjectifGlobalItem[]>(initialData.objectifs);
  const [acteurs, setActeurs] = useState<ActeurWithObjectifs[]>(initialData.acteurs);
  const [users] = useState<ObjectifAssigneeUser[]>(initialData.users);
  const [refreshing, setRefreshing] = useState(false);
  const [miseEnOeuvreData, setMiseEnOeuvreData] = useState<ObjectifGlobalMiseEnOeuvreData | null>(
    null
  );
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksLoadError, setTasksLoadError] = useState<string | null>(null);

  const [rubriqueForm, setRubriqueForm] = useState("");
  const [editingRubriqueId, setEditingRubriqueId] = useState<string | null>(null);
  const [savingRubrique, setSavingRubrique] = useState(false);

  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("all");
  const [objectifSearch, setObjectifSearch] = useState("");
  const [objectifForm, setObjectifForm] = useState({
    rubriqueId: "",
    userIds: [] as string[],
    objectif: "",
    frequence: "",
    plateforme: "",
    style_Thon: "",
  });
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false);
  const [editingObjectifId, setEditingObjectifId] = useState<string | null>(null);
  const [savingObjectif, setSavingObjectif] = useState(false);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    const result = await getObjectifsPrincipauxPageData();
    if (result.success) {
      setRubriques(result.data.rubriques);
      setObjectifs(result.data.objectifs);
      setActeurs(result.data.acteurs);
    } else {
      toast.error(result.error);
    }
    setRefreshing(false);
  }, []);

  const refreshMiseEnOeuvre = useCallback(async () => {
    setTasksLoading(true);
    setTasksLoadError(null);
    const result = await getObjectifGlobalMiseEnOeuvreData();
    setTasksLoading(false);
    if (result.success) {
      setMiseEnOeuvreData(result.data);
    } else {
      setMiseEnOeuvreData(null);
      setTasksLoadError(result.error);
      toast.error(result.error);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "mise-en-oeuvre") return;
    void refreshMiseEnOeuvre();
  }, [activeTab, refreshMiseEnOeuvre]);

  const handleRefresh = useCallback(async () => {
    await refreshData();
    if (activeTab === "mise-en-oeuvre") {
      await refreshMiseEnOeuvre();
    }
  }, [activeTab, refreshData, refreshMiseEnOeuvre]);

  const filteredObjectifs = useMemo(() => {
    let list =
      selectedUserFilter === "all"
        ? objectifs
        : objectifs.filter((o) => o.userId === selectedUserFilter);
    const q = objectifSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.objectif.toLowerCase().includes(q) ||
          o.rubrique?.toLowerCase().includes(q) ||
          o.userName?.toLowerCase().includes(q) ||
          o.plateforme?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [objectifs, selectedUserFilter, objectifSearch]);

  const activeTabConfig = TABS.find((t) => t.id === activeTab)!;
  const panelStyles = TAB_PANEL_STYLES[activeTab];

  async function handleSaveRubrique() {
    const name = rubriqueForm.trim();
    if (!name) {
      toast.error("Le nom de la rubrique est obligatoire.");
      return;
    }

    setSavingRubrique(true);
    const result = editingRubriqueId
      ? await updateRubriqueObjectifGlobal({ id: editingRubriqueId, rubrique: name })
      : await createRubriqueObjectifGlobal({ rubrique: name });

    if (result.success) {
      toast.success(editingRubriqueId ? "Rubrique mise à jour." : "Rubrique créée.");
      setRubriqueForm("");
      setEditingRubriqueId(null);
      await refreshData();
    } else {
      toast.error(result.error);
    }
    setSavingRubrique(false);
  }

  async function handleDeleteRubrique(id: string) {
    const result = await deleteRubriqueObjectifGlobal(id);
    if (result.success) {
      toast.success("Rubrique supprimée.");
      await refreshData();
    } else {
      toast.error(result.error);
    }
  }

  async function handleSaveObjectif() {
    if (!objectifForm.rubriqueId) {
      toast.error("Sélectionnez une rubrique.");
      return;
    }
    if (objectifForm.userIds.length === 0) {
      toast.error("Sélectionnez au moins un utilisateur.");
      return;
    }
    if (!objectifForm.objectif.trim()) {
      toast.error("L'objectif est obligatoire.");
      return;
    }

    setSavingObjectif(true);
    const payload = {
      objectif: objectifForm.objectif.trim(),
      frequence: objectifForm.frequence.trim(),
      plateforme: objectifForm.plateforme.trim(),
      style_Thon: objectifForm.style_Thon.trim(),
    };

    if (editingObjectifId) {
      const result = await updateObjectifGlobal({
        id: editingObjectifId,
        rubriqueId: objectifForm.rubriqueId,
        ...payload,
      });
      if (result.success) {
        toast.success("Objectif mis à jour.");
        setObjectifForm({
          rubriqueId: "",
          userIds: [],
          objectif: "",
          frequence: "",
          plateforme: "",
          style_Thon: "",
        });
        setAssigneePopoverOpen(false);
        setEditingObjectifId(null);
        await refreshData();
      } else {
        toast.error(result.error);
      }
    } else {
      const result = await createObjectifGlobalForUsers({
        userIds: objectifForm.userIds,
        rubriqueId: objectifForm.rubriqueId,
        ...payload,
      });
      if (result.success) {
        const count = result.data?.createdCount ?? objectifForm.userIds.length;
        toast.success(
          count > 1
            ? `Objectif créé et assigné à ${count} utilisateurs.`
            : "Objectif créé et assigné."
        );
        setObjectifForm({
          rubriqueId: "",
          userIds: [],
          objectif: "",
          frequence: "",
          plateforme: "",
          style_Thon: "",
        });
        setAssigneePopoverOpen(false);
        setEditingObjectifId(null);
        await refreshData();
      } else {
        toast.error(result.error);
      }
    }
    setSavingObjectif(false);
  }

  async function handleDeleteObjectif(id: string) {
    const result = await deleteObjectifGlobal(id);
    if (result.success) {
      toast.success("Objectif supprimé.");
      await refreshData();
    } else {
      toast.error(result.error);
    }
  }

  function startEditRubrique(r: RubriqueItem) {
    setEditingRubriqueId(r.id);
    setRubriqueForm(r.rubrique);
  }

  function startEditObjectif(o: ObjectifGlobalItem) {
    setEditingObjectifId(o.id);
    setObjectifForm({
      rubriqueId: o.rubriqueId ?? "",
      userIds: o.userId ? [o.userId] : [],
      objectif: o.objectif,
      frequence: o.frequence,
      plateforme: o.plateforme,
      style_Thon: o.style_Thon,
    });
    setActiveTab("objectifs-principaux");
  }

  function toggleAssignee(userId: string) {
    setObjectifForm((f) => ({
      ...f,
      userIds: f.userIds.includes(userId)
        ? f.userIds.filter((id) => id !== userId)
        : [...f.userIds, userId],
    }));
  }

  function selectAllAssignees() {
    setObjectifForm((f) => ({ ...f, userIds: users.map((u) => u.id) }));
  }

  function clearAssignees() {
    setObjectifForm((f) => ({ ...f, userIds: [] }));
  }

  const selectedAssigneesLabel = useMemo(() => {
    if (objectifForm.userIds.length === 0) return "Choisir un ou plusieurs acteurs";
    if (objectifForm.userIds.length === 1) {
      const u = users.find((x) => x.id === objectifForm.userIds[0]);
      return u ? `${u.name} — ${ROLE_LABELS[u.role] ?? u.role}` : "1 utilisateur";
    }
    return `${objectifForm.userIds.length} utilisateurs sélectionnés`;
  }, [objectifForm.userIds, users]);

  return (
    <div className="min-h-full -mx-4 -mt-4 bg-slate-50/80 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-sky-600 via-cyan-600 to-teal-700 px-4 pb-6 pt-6 sm:px-6 sm:pb-8 sm:pt-8 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.18),transparent_50%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 top-0 h-56 w-56 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-teal-300/25 blur-2xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-sm ring-1 ring-white/25">
                  <Megaphone className="h-3.5 w-3.5 text-amber-200" />
                  Communication
                </span>
                <Badge className="border-0 bg-white/20 text-white hover:bg-white/25">
                  {acteurs.length} acteur{acteurs.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                Objectifs principaux
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">
                Pilotez vos rubriques, définissez des objectifs et assignez-les à votre équipe
                Communication, Infographie et Commercial.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:max-w-sm lg:shrink-0">
              {[
                { label: "Rubriques", value: rubriques.length, icon: Layers },
                { label: "Objectifs", value: objectifs.length, icon: Target },
                { label: "Acteurs", value: acteurs.length, icon: UserCircle2, wide: true },
              ].map((stat) => {
                const StatIcon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl bg-white/10 px-3.5 py-3 backdrop-blur-md ring-1 ring-white/20",
                      stat.wide && "col-span-2 sm:col-span-1"
                    )}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                      <StatIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-sky-100/80">
                        {stat.label}
                      </p>
                      <p className="text-xl font-bold text-white">{stat.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="relative mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div
          className="pointer-events-none absolute -left-24 top-4 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 top-24 h-64 w-64 rounded-full bg-violet-200/25 blur-3xl"
          aria-hidden
        />

        <div className="relative space-y-5 sm:space-y-6">
          {/* Mobile tab select */}
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

          {/* Desktop tabs */}
          <nav className="hidden md:block" aria-label="Sections objectifs">
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap">
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
                      "group flex min-w-[10rem] shrink-0 items-center gap-2.5 rounded-2xl border px-4 py-3 text-left transition-all duration-200 lg:min-w-0 lg:flex-1",
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
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                        isActive ? "bg-white/20" : tab.inactiveIcon
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "truncate text-sm font-semibold",
                          isActive ? "text-white" : tab.inactiveText
                        )}
                      >
                        {tab.shortLabel}
                      </p>
                      <p
                        className={cn(
                          "truncate text-xs",
                          isActive ? "text-white/80" : "text-slate-500"
                        )}
                      >
                        {tab.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Panel header */}
          <div
            className={cn(
              "flex flex-col gap-3 rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:p-5",
              panelStyles.accent,
              "ring-1",
              panelStyles.ring
            )}
          >
            <div>
              <div className="flex items-center gap-2">
                <activeTabConfig.icon className="h-5 w-5 text-slate-600" />
                <h2 className="text-lg font-semibold text-slate-900">{activeTabConfig.label}</h2>
              </div>
              <p className="mt-0.5 text-sm text-slate-500">{activeTabConfig.description}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || tasksLoading}
              className="shrink-0 rounded-xl border-slate-200 bg-white"
            >
              {refreshing || tasksLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Actualiser
            </Button>
          </div>

          {/* ——— Rubriques ——— */}
          {activeTab === "rubriques" && (
            <div className="grid gap-5 lg:grid-cols-5 lg:gap-6">
              <GlassCard ringClass={panelStyles.ring} className="lg:col-span-2">
                <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-transparent pb-4">
                  <div className="flex items-center gap-2">
                    <div className={cn("rounded-lg p-2", panelStyles.badge)}>
                      <Plus className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {editingRubriqueId ? "Modifier" : "Nouvelle rubrique"}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Étape 1 — structurez vos objectifs par thème
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-5">
                  <div className="space-y-2">
                    <Label htmlFor="rubrique-name" className="text-slate-700">
                      Nom de la rubrique
                    </Label>
                    <Input
                      id="rubrique-name"
                      value={rubriqueForm}
                      onChange={(e) => setRubriqueForm(e.target.value)}
                      placeholder="Réseaux sociaux, Branding…"
                      className="h-11 rounded-xl border-slate-200"
                      onKeyDown={(e) => e.key === "Enter" && handleSaveRubrique()}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editingRubriqueId && (
                      <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => {
                          setEditingRubriqueId(null);
                          setRubriqueForm("");
                        }}
                      >
                        Annuler
                      </Button>
                    )}
                    <Button
                      className={cn("flex-1 rounded-xl sm:flex-none", panelStyles.button)}
                      onClick={handleSaveRubrique}
                      disabled={savingRubrique}
                    >
                      {savingRubrique && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingRubriqueId ? "Enregistrer" : "Créer la rubrique"}
                    </Button>
                  </div>
                </CardContent>
              </GlassCard>

              <GlassCard ringClass={panelStyles.ring} className="lg:col-span-3">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
                  <CardTitle className="text-base">Rubriques existantes</CardTitle>
                  <Badge variant="secondary" className="rounded-lg">
                    {rubriques.length}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4">
                  {rubriques.length === 0 ? (
                    <EmptyState
                      icon={FolderOpen}
                      title="Aucune rubrique"
                      description="Créez votre première rubrique pour pouvoir définir des objectifs."
                    />
                  ) : (
                    <>
                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead>Rubrique</TableHead>
                              <TableHead>Objectifs</TableHead>
                              <TableHead>Créée le</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rubriques.map((r) => (
                              <TableRow key={r.id} className="group">
                                <TableCell>
                                  <span className="font-medium text-slate-900">{r.rubrique}</span>
                                </TableCell>
                                <TableCell>
                                  <Badge className={cn("rounded-md", panelStyles.badge)}>
                                    {r.objectifCount}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-slate-500">
                                  {format(new Date(r.createdAt), "dd MMM yyyy", { locale: fr })}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-lg"
                                      onClick={() => startEditRubrique(r)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600"
                                      onClick={() => handleDeleteRubrique(r.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="grid gap-3 md:hidden">
                        {rubriques.map((r) => (
                          <div
                            key={r.id}
                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4"
                          >
                            <div>
                              <p className="font-semibold text-slate-900">{r.rubrique}</p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {r.objectifCount} objectif{r.objectifCount !== 1 ? "s" : ""} ·{" "}
                                {format(new Date(r.createdAt), "dd MMM yyyy", { locale: fr })}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => startEditRubrique(r)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-red-500"
                                onClick={() => handleDeleteRubrique(r.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </GlassCard>
            </div>
          )}

          {/* ——— Objectifs principaux ——— */}
          {activeTab === "objectifs-principaux" && (
            <div className="space-y-5">
              {rubriques.length === 0 ? (
                <EmptyState
                  icon={Target}
                  title="Rubriques requises"
                  description="Créez d'abord au moins une rubrique avant de définir des objectifs."
                  action={
                    <Button
                      className={cn("rounded-xl", panelStyles.button)}
                      onClick={() => setActiveTab("rubriques")}
                    >
                      <FolderOpen className="mr-2 h-4 w-4" />
                      Créer une rubrique
                    </Button>
                  }
                />
              ) : (
                <>
                  <GlassCard
                    ringClass={panelStyles.ring}
                    className={cn(editingObjectifId && "ring-2 ring-violet-300/50")}
                  >
                    <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-violet-50/60 to-transparent">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md shadow-violet-500/20">
                          <Target className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {editingObjectifId ? "Modifier l'objectif" : "Nouvel objectif principal"}
                          </CardTitle>
                          <CardDescription>
                            Rubrique et assignation multi-utilisateurs. Chaque acteur reçoit sa
                            propre copie.
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Rubrique</Label>
                        <Select
                          value={objectifForm.rubriqueId}
                          onValueChange={(v) =>
                            setObjectifForm((f) => ({ ...f, rubriqueId: v }))
                          }
                        >
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="Choisir une rubrique" />
                          </SelectTrigger>
                          <SelectContent>
                            {rubriques.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.rubrique}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Utilisateurs assignés</Label>
                        {editingObjectifId ? (
                          <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                            {selectedAssigneesLabel}
                          </div>
                        ) : (
                          <>
                            <Popover
                              open={assigneePopoverOpen}
                              onOpenChange={setAssigneePopoverOpen}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-11 w-full justify-between rounded-xl font-normal"
                                >
                                  <span className="truncate text-left">
                                    {selectedAssigneesLabel}
                                  </span>
                                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-[min(100vw-2rem,var(--radix-popover-trigger-width))] p-0 sm:w-[var(--radix-popover-trigger-width)]"
                                align="start"
                              >
                                <div className="flex items-center justify-between border-b px-3 py-2.5">
                                  <span className="text-xs font-semibold text-slate-600">
                                    {objectifForm.userIds.length} sélectionné
                                    {objectifForm.userIds.length !== 1 ? "s" : ""}
                                  </span>
                                  <div className="flex gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 rounded-lg px-2 text-xs"
                                      onClick={selectAllAssignees}
                                    >
                                      Tout
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 rounded-lg px-2 text-xs"
                                      onClick={clearAssignees}
                                    >
                                      Aucun
                                    </Button>
                                  </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto p-2">
                                  {users.map((u) => {
                                    const checked = objectifForm.userIds.includes(u.id);
                                    return (
                                      <label
                                        key={u.id}
                                        className={cn(
                                          "flex cursor-pointer items-start gap-3 rounded-xl px-2.5 py-2.5 transition-colors",
                                          checked ? "bg-violet-50" : "hover:bg-slate-50"
                                        )}
                                      >
                                        <Checkbox
                                          checked={checked}
                                          onCheckedChange={() => toggleAssignee(u.id)}
                                          className="mt-0.5"
                                        />
                                        <div className="min-w-0 flex-1">
                                          <p className="text-sm font-medium">{u.name}</p>
                                          <p className="text-xs text-slate-500">
                                            {ROLE_LABELS[u.role] ?? u.role} · {u.job}
                                          </p>
                                        </div>
                                      </label>
                                    );
                                  })}
                                </div>
                              </PopoverContent>
                            </Popover>
                            {objectifForm.userIds.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {objectifForm.userIds.map((id) => {
                                  const u = users.find((x) => x.id === id);
                                  if (!u) return null;
                                  return (
                                    <Badge
                                      key={id}
                                      variant="secondary"
                                      className="cursor-pointer gap-1 rounded-lg bg-violet-100 text-violet-800 hover:bg-violet-200"
                                      onClick={() => toggleAssignee(id)}
                                    >
                                      {u.name}
                                      <span className="opacity-60">×</span>
                                    </Badge>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <Label>Objectif</Label>
                        <Input
                          value={objectifForm.objectif}
                          onChange={(e) =>
                            setObjectifForm((f) => ({ ...f, objectif: e.target.value }))
                          }
                          placeholder="Description de l'objectif"
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fréquence</Label>
                        <Input
                          value={objectifForm.frequence}
                          onChange={(e) =>
                            setObjectifForm((f) => ({ ...f, frequence: e.target.value }))
                          }
                          placeholder="Hebdomadaire, Mensuel…"
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Plateforme</Label>
                        <Input
                          value={objectifForm.plateforme}
                          onChange={(e) =>
                            setObjectifForm((f) => ({ ...f, plateforme: e.target.value }))
                          }
                          placeholder="Instagram, LinkedIn…"
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Style / Ton</Label>
                        <Input
                          value={objectifForm.style_Thon}
                          onChange={(e) =>
                            setObjectifForm((f) => ({ ...f, style_Thon: e.target.value }))
                          }
                          placeholder="Professionnel, Dynamique…"
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 sm:col-span-2">
                        {editingObjectifId && (
                          <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => {
                              setEditingObjectifId(null);
                              setObjectifForm({
                                rubriqueId: "",
                                userIds: [],
                                objectif: "",
                                frequence: "",
                                plateforme: "",
                                style_Thon: "",
                              });
                              setAssigneePopoverOpen(false);
                            }}
                          >
                            Annuler
                          </Button>
                        )}
                        <Button
                          className={cn("rounded-xl", panelStyles.button)}
                          onClick={handleSaveObjectif}
                          disabled={savingObjectif}
                        >
                          {savingObjectif && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {editingObjectifId ? "Enregistrer" : "Créer et assigner"}
                        </Button>
                      </div>
                    </CardContent>
                  </GlassCard>

                  <GlassCard ringClass={panelStyles.ring}>
                    <CardHeader className="space-y-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between sm:space-y-0">
                      <div>
                        <CardTitle className="text-base">Objectifs assignés</CardTitle>
                        <CardDescription>
                          {filteredObjectifs.length} résultat
                          {filteredObjectifs.length !== 1 ? "s" : ""}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            value={objectifSearch}
                            onChange={(e) => setObjectifSearch(e.target.value)}
                            placeholder="Rechercher…"
                            className="h-10 w-full rounded-xl pl-9 sm:w-48"
                          />
                        </div>
                        <Select value={selectedUserFilter} onValueChange={setSelectedUserFilter}>
                          <SelectTrigger className="h-10 w-full rounded-xl sm:w-[200px]">
                            <SelectValue placeholder="Filtrer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les utilisateurs</SelectItem>
                            {users.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {filteredObjectifs.length === 0 ? (
                        <EmptyState
                          icon={LayoutGrid}
                          title="Aucun objectif"
                          description="Ajustez vos filtres ou créez un nouvel objectif ci-dessus."
                        />
                      ) : (
                        <>
                          <div className="hidden lg:block">
                            <Table>
                              <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                  <TableHead>Rubrique</TableHead>
                                  <TableHead>Objectif</TableHead>
                                  <TableHead>Fréquence</TableHead>
                                  <TableHead>Plateforme</TableHead>
                                  <TableHead>Style</TableHead>
                                  <TableHead>Assigné à</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredObjectifs.map((o) => (
                                  <TableRow key={o.id} className="group">
                                    <TableCell>
                                      <Badge variant="outline" className="rounded-md font-normal">
                                        {o.rubrique}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[220px] whitespace-normal font-medium">
                                      {o.objectif}
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                      {o.frequence || "—"}
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                      {o.plateforme || "—"}
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                      {o.style_Thon || "—"}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={cn(
                                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white",
                                            AVATAR_GRADIENTS[
                                              (o.userName?.length ?? 0) % AVATAR_GRADIENTS.length
                                            ]
                                          )}
                                        >
                                          {initials(o.userName ?? "?")}
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">{o.userName}</p>
                                          <p className="text-xs text-slate-500">
                                            {ROLE_LABELS[o.userRole ?? ""] ?? o.userRole}
                                          </p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 rounded-lg"
                                          onClick={() => startEditObjectif(o)}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50"
                                          onClick={() => handleDeleteObjectif(o.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          <div className="grid gap-3 lg:hidden">
                            {filteredObjectifs.map((o) => (
                              <div
                                key={o.id}
                                className="rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-sm"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <Badge variant="outline" className="mb-2 rounded-md text-xs">
                                      {o.rubrique}
                                    </Badge>
                                    <p className="font-semibold leading-snug text-slate-900">
                                      {o.objectif}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                                      {o.frequence && (
                                        <span className="rounded-md bg-slate-100 px-2 py-0.5">
                                          {o.frequence}
                                        </span>
                                      )}
                                      {o.plateforme && (
                                        <span className="rounded-md bg-slate-100 px-2 py-0.5">
                                          {o.plateforme}
                                        </span>
                                      )}
                                      {o.style_Thon && (
                                        <span className="rounded-md bg-slate-100 px-2 py-0.5">
                                          {o.style_Thon}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex shrink-0 gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9"
                                      onClick={() => startEditObjectif(o)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 text-red-500"
                                      onClick={() => handleDeleteObjectif(o.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                                  <div
                                    className={cn(
                                      "flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white",
                                      AVATAR_GRADIENTS[
                                        (o.userName?.length ?? 0) % AVATAR_GRADIENTS.length
                                      ]
                                    )}
                                  >
                                    {initials(o.userName ?? "?")}
                                  </div>
                                  <span className="text-sm text-slate-600">{o.userName}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </GlassCard>
                </>
              )}
            </div>
          )}

          {/* ——— Acteurs ——— */}
          {activeTab === "acteurs" && (
            <div className="space-y-4">
              {acteurs.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Aucun acteur assigné"
                  description="Assignez des objectifs pour voir apparaître les acteurs et leurs missions."
                  action={
                    <Button
                      className={cn("rounded-xl", panelStyles.button)}
                      onClick={() => setActiveTab("objectifs-principaux")}
                    >
                      <Target className="mr-2 h-4 w-4" />
                      Créer un objectif
                    </Button>
                  }
                />
              ) : (
                acteurs.map((acteur, index) => (
                  <GlassCard key={acteur.userId} ringClass={panelStyles.ring}>
                    <CardHeader className="border-b border-slate-100 pb-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <div
                          className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-bold text-white shadow-md",
                            AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
                          )}
                        >
                          {initials(acteur.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg">{acteur.name}</CardTitle>
                          <CardDescription className="mt-0.5">
                            {acteur.job} · {acteur.department}
                          </CardDescription>
                          <p className="mt-1 truncate text-xs text-slate-400">{acteur.email}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={cn("rounded-lg", panelStyles.badge)}>
                            {ROLE_LABELS[acteur.role] ?? acteur.role}
                          </Badge>
                          <Badge variant="secondary" className="rounded-lg">
                            {acteur.objectifs.length} objectif
                            {acteur.objectifs.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead>Rubrique</TableHead>
                              <TableHead>Objectif</TableHead>
                              <TableHead>Fréquence</TableHead>
                              <TableHead>Plateforme</TableHead>
                              <TableHead>Style</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {acteur.objectifs.map((o) => (
                              <TableRow key={o.id}>
                                <TableCell>
                                  <Badge variant="outline" className="rounded-md">
                                    {o.rubrique}
                                  </Badge>
                                </TableCell>
                                <TableCell className="whitespace-normal font-medium">
                                  {o.objectif}
                                </TableCell>
                                <TableCell>{o.frequence || "—"}</TableCell>
                                <TableCell>{o.plateforme || "—"}</TableCell>
                                <TableCell>{o.style_Thon || "—"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="grid gap-2 md:hidden">
                        {acteur.objectifs.map((o) => (
                          <div
                            key={o.id}
                            className="rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                          >
                            <Badge variant="outline" className="mb-1.5 rounded-md text-xs">
                              {o.rubrique}
                            </Badge>
                            <p className="text-sm font-medium text-slate-900">{o.objectif}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {[o.frequence, o.plateforme, o.style_Thon]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </GlassCard>
                ))
              )}
            </div>
          )}

          {/* ——— Mise en Oeuvre ——— */}
          {activeTab === "mise-en-oeuvre" && (
            <ObjectifsGlobalMiseEnOeuvrePanel
              loading={tasksLoading}
              loadError={tasksLoadError}
              data={miseEnOeuvreData}
              onRefresh={refreshMiseEnOeuvre}
            />
          )}
        </div>
      </div>
    </div>
  );
}
