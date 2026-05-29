"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Users,
  Loader2,
  UserPlus,
  FolderKanban,
  XCircle,
  Calendar,
  ChevronRight,
  Building2,
  Briefcase,
  ClipboardList,
  Link2,
} from "lucide-react";
import type { CommunicationProjectListItem } from "@/lib/actions/communication-project";
import type {
  CommunicationProjectActor,
  UserForActorOption,
} from "@/lib/actions/communication-actor";
import {
  createProjectActor,
  deleteProjectActor,
  getActorsByProject,
  getUsersForProjectActors,
} from "@/lib/actions/communication-actor";
import type { PlanActionItem } from "@/lib/actions/communication-plan-action";
import { getPlanActionsByProjectId } from "@/lib/actions/communication-plan-action";
import {
  assignActorsToAction,
  getAssignmentsByProjectId,
} from "@/lib/actions/communication-plan-action-actor";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ActeursRolesClientProps {
  initialProjects: CommunicationProjectListItem[];
  embedded?: boolean;
}

const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-fuchsia-500 to-pink-600",
  "from-indigo-500 to-blue-600",
  "from-teal-500 to-emerald-600",
  "from-amber-500 to-orange-600",
];

type AccentTheme = {
  badge: string;
  button: string;
  ring: string;
  chipActive: string;
  step: string;
  loader: string;
  statIcon: string;
  emptyBorder: string;
  emptyIconBg: string;
  emptyIconColor: string;
};

const EMBEDDED_ACCENT: AccentTheme = {
  badge: "bg-violet-100 text-violet-800 border-violet-200",
  button: "bg-violet-600 hover:bg-violet-700",
  ring: "focus:ring-violet-500/20",
  chipActive:
    "border-violet-300 bg-violet-50 text-violet-900 ring-1 ring-violet-200",
  step: "bg-violet-100 text-violet-800",
  loader: "text-violet-500",
  statIcon: "bg-violet-100 text-violet-600",
  emptyBorder: "border-violet-200",
  emptyIconBg: "bg-violet-100",
  emptyIconColor: "text-violet-400",
};

const STANDALONE_ACCENT: AccentTheme = {
  badge: "bg-amber-100 text-amber-800 border-amber-200",
  button: "bg-amber-600 hover:bg-amber-700",
  ring: "focus:ring-amber-500/20",
  chipActive:
    "border-amber-300 bg-amber-50 text-amber-900 ring-1 ring-amber-200",
  step: "bg-amber-100 text-amber-800",
  loader: "text-amber-500",
  statIcon: "bg-amber-100 text-amber-600",
  emptyBorder: "border-slate-200",
  emptyIconBg: "bg-slate-100",
  emptyIconColor: "text-slate-400",
};

export default function ActeursRolesClient({
  initialProjects,
  embedded,
}: ActeursRolesClientProps) {
  const accent = embedded ? EMBEDDED_ACCENT : STANDALONE_ACCENT;

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [actors, setActors] = useState<CommunicationProjectActor[]>([]);
  const [planActions, setPlanActions] = useState<PlanActionItem[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [isLoadingActors, setIsLoadingActors] = useState(false);
  const [isLoadingActions, setIsLoadingActions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [users, setUsers] = useState<UserForActorOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    job: "",
  });

  useEffect(() => {
    if (!selectedProjectId && initialProjects.length > 0) {
      setSelectedProjectId(initialProjects[0].id);
    }
  }, [initialProjects, selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId) {
      loadActors(selectedProjectId);
      loadPlanActions(selectedProjectId);
      loadAssignments(selectedProjectId);
    } else {
      setActors([]);
      setPlanActions([]);
      setAssignments({});
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (!dialogOpen) {
      setSelectedUserId("");
      setFormData({ name: "", department: "", job: "" });
      return;
    }

    let cancelled = false;

    const loadUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const result = await getUsersForProjectActors();
        if (cancelled) return;
        if (result.success) {
          setUsers(result.users);
        } else {
          toast.error(result.error || "Erreur lors du chargement des utilisateurs");
          setUsers([]);
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Error loading users:", error);
        toast.error("Erreur lors du chargement des utilisateurs");
        setUsers([]);
      } finally {
        if (!cancelled) setIsLoadingUsers(false);
      }
    };

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [dialogOpen]);

  const availableUsers = useMemo(() => {
    const existingNames = new Set(
      actors.map((a) => a.name.trim().toLowerCase())
    );
    return users.filter(
      (u) => !existingNames.has(u.name.trim().toLowerCase())
    );
  }, [users, actors]);

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find((u) => u.id === userId);
    if (user) {
      setFormData({
        name: user.name,
        department: user.department,
        job: user.job,
      });
    }
  };

  const loadActors = async (projectId: string) => {
    setIsLoadingActors(true);
    try {
      const result = await getActorsByProject(projectId);
      if (result.success) {
        setActors(result.actors);
      } else {
        toast.error("Erreur lors du chargement des acteurs");
        setActors([]);
      }
    } catch (error) {
      console.error("Error loading actors:", error);
      toast.error("Erreur lors du chargement des acteurs.");
      setActors([]);
    } finally {
      setIsLoadingActors(false);
    }
  };

  const loadPlanActions = async (projectId: string) => {
    setIsLoadingActions(true);
    try {
      const res = await getPlanActionsByProjectId(projectId);
      setPlanActions(res.success ? res.actions : []);
    } catch (error) {
      console.error("Error loading plan actions:", error);
      toast.error("Erreur lors du chargement des actions.");
      setPlanActions([]);
    } finally {
      setIsLoadingActions(false);
    }
  };

  const loadAssignments = async (projectId: string) => {
    try {
      const res = await getAssignmentsByProjectId(projectId);
      setAssignments(res.success ? res.assignments : {});
    } catch (error) {
      console.error("Error loading assignments:", error);
      setAssignments({});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProjectId) {
      toast.error("Veuillez sélectionner un projet");
      return;
    }

    if (!selectedUserId) {
      toast.error("Veuillez sélectionner un utilisateur");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Le nom de l'acteur est obligatoire");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createProjectActor({
        projectId: selectedProjectId,
        name: formData.name.trim(),
        department: formData.department.trim(),
        job: formData.job.trim(),
      });

      if (result.success) {
        toast.success("Acteur ajouté avec succès");
        setSelectedUserId("");
        setFormData({ name: "", department: "", job: "" });
        setDialogOpen(false);
        await loadActors(selectedProjectId);
      } else {
        toast.error(result.error || "Erreur lors de l'ajout de l'acteur");
      }
    } catch (error) {
      console.error("Error adding actor:", error);
      toast.error("Erreur lors de l'ajout de l'acteur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (actorId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet acteur ?")) return;

    try {
      const result = await deleteProjectActor(actorId, selectedProjectId);

      if (result.success) {
        toast.success("Acteur supprimé avec succès");
        await loadActors(selectedProjectId);
        await loadAssignments(selectedProjectId);
      } else {
        toast.error(result.error || "Erreur lors de la suppression de l'acteur");
      }
    } catch (error) {
      console.error("Error deleting actor:", error);
      toast.error("Erreur lors de la suppression de l'acteur.");
    }
  };

  const handleAssignActors = async (actionId: string, actorIds: string[]) => {
    const res = await assignActorsToAction({ actionId, actorIds });
    if (res.success) {
      toast.success("Acteurs affectés avec succès");
      setAssignments((prev) => ({ ...prev, [actionId]: actorIds }));
    } else {
      toast.error(res.error || "Erreur lors de l'affectation des acteurs");
    }
  };

  const handleActorCheckChange = (
    actionId: string,
    actorId: string,
    checked: boolean
  ) => {
    const current = assignments[actionId] ?? [];
    const next = checked
      ? [...current, actorId]
      : current.filter((id) => id !== actorId);
    setAssignments((prev) => ({ ...prev, [actionId]: next }));
    handleAssignActors(actionId, next);
  };

  const selectedProject = initialProjects.find(
    (p) => p.id === selectedProjectId
  );

  const assignmentCount = useMemo(
    () =>
      Object.values(assignments).reduce(
        (sum, ids) => sum + (ids?.length ?? 0),
        0
      ),
    [assignments]
  );

  const getAvatarColor = (name: string) =>
    AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div
      className={cn(
        embedded ? "" : "min-h-screen bg-gradient-to-b from-slate-50 to-white"
      )}
    >
      {!embedded && (
        <header className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.12),transparent_50%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-12 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl sm:h-56 sm:w-56"
            aria-hidden
          />
          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-violet-100 backdrop-blur-sm">
                <Users className="h-3.5 w-3.5" />
                Gestion des équipes
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                Acteurs et rôles
              </h1>
              <p className="max-w-2xl text-sm text-violet-100/90 sm:text-base">
                Gérez les acteurs de vos projets et affectez-les aux actions du
                plan de communication.
              </p>
            </div>
          </div>
        </header>
      )}

      <div
        className={cn(
          "mx-auto",
          embedded
            ? "max-w-full px-4 py-5 sm:px-6 sm:py-6"
            : "max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        )}
      >
        {/* Toolbar */}
        <div
          className={cn(
            "mb-6 rounded-2xl border bg-white p-4 shadow-sm sm:mb-8 sm:p-5",
            embedded ? "border-violet-100" : "border-slate-200/80"
          )}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <Label
                htmlFor="project-select"
                className="text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Projet
              </Label>
              <Select
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
              >
                <SelectTrigger
                  id="project-select"
                  className={cn(
                    "h-11 w-full rounded-xl border-slate-200 bg-slate-50/50 text-base shadow-sm transition hover:bg-white sm:h-12 sm:max-w-md",
                    accent.ring
                  )}
                >
                  <FolderKanban className="mr-2 h-5 w-5 shrink-0 text-slate-400" />
                  <SelectValue placeholder="Choisir un projet..." />
                </SelectTrigger>
                <SelectContent className="max-h-[min(70vh,320px)]">
                  {initialProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                      <div className="rounded-full bg-slate-100 p-4">
                        <XCircle className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="mt-3 text-sm font-medium text-slate-700">
                        Aucun projet actif
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Créez un projet dans Communication → Projets
                      </p>
                    </div>
                  ) : (
                    initialProjects.map((project) => (
                      <SelectItem
                        key={project.id}
                        value={project.id}
                        className="py-2.5"
                      >
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{project.name}</span>
                          <Badge
                            variant="secondary"
                            className="bg-emerald-100 text-xs font-normal text-emerald-700"
                          >
                            Actif
                          </Badge>
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {embedded && (
                <p className="text-xs text-slate-500">
                  Sélectionnez le projet pour gérer son équipe et les
                  affectations.
                </p>
              )}
            </div>

            {selectedProjectId && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className={cn(
                      "h-11 w-full gap-2 text-white shadow-sm sm:h-12 sm:w-auto sm:px-6",
                      accent.button
                    )}
                  >
                    <UserPlus className="h-5 w-5 shrink-0" />
                    Ajouter un acteur
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Nouvel acteur</DialogTitle>
                    <DialogDescription>
                      Sélectionnez un utilisateur de l&apos;organisation à
                      ajouter au projet
                      {selectedProject ? ` « ${selectedProject.name} »` : ""}.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="dialog-user">
                        Utilisateur <span className="text-rose-500">*</span>
                      </Label>
                      {isLoadingUsers ? (
                        <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Chargement des utilisateurs...
                        </div>
                      ) : availableUsers.length === 0 ? (
                        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                          {users.length === 0
                            ? "Aucun utilisateur trouvé dans la base de données."
                            : "Tous les utilisateurs sont déjà acteurs de ce projet."}
                        </p>
                      ) : (
                        <Select
                          value={selectedUserId}
                          onValueChange={handleUserSelect}
                        >
                          <SelectTrigger
                            id="dialog-user"
                            className={cn("border-slate-200", accent.ring)}
                          >
                            <SelectValue placeholder="Choisir un utilisateur..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {availableUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                <span className="flex flex-col items-start gap-0.5">
                                  <span className="font-medium">
                                    {user.name}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {user.email}
                                  </span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    {selectedUserId && (
                      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                        <div className="flex items-start gap-2 text-sm">
                          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-700">
                              Département
                            </p>
                            <p className="text-slate-600">
                              {formData.department}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-700">
                              Poste
                            </p>
                            <p className="text-slate-600">{formData.job}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        className="w-full border-slate-200 sm:w-auto"
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          isSubmitting ||
                          isLoadingUsers ||
                          !selectedUserId ||
                          availableUsers.length === 0
                        }
                        className={cn("w-full sm:w-auto", accent.button)}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Ajout...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Ajouter
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Stats */}
        {selectedProjectId && (
          <div className="mb-6 grid grid-cols-3 gap-2 sm:mb-8 sm:gap-4">
            {[
              { label: "Acteurs", value: actors.length, icon: Users },
              { label: "Actions", value: planActions.length, icon: ClipboardList },
              { label: "Affectations", value: assignmentCount, icon: Link2 },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200/80 bg-white px-3 py-3 shadow-sm sm:rounded-2xl sm:px-4 sm:py-4"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl",
                      accent.statIcon
                    )}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
                      {label}
                    </p>
                    <p className="text-lg font-bold text-slate-900 sm:text-2xl">
                      {value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedProjectId ? (
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
            {/* Actors */}
            <div className="lg:col-span-4 xl:col-span-3">
              <Card
                className={cn(
                  "overflow-hidden border shadow-sm lg:sticky lg:top-4",
                  embedded ? "border-violet-100" : "border-slate-200/80"
                )}
              >
                <CardHeader className="space-y-1 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10",
                          accent.statIcon
                        )}
                      >
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base font-semibold text-slate-900 sm:text-lg">
                          Acteurs
                        </CardTitle>
                        <CardDescription className="truncate text-xs sm:text-sm">
                          {selectedProject?.name}
                        </CardDescription>
                      </div>
                    </div>
                    {actors.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="shrink-0 bg-slate-100 font-semibold text-slate-800"
                      >
                        {actors.length}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoadingActors ? (
                    <LoadingState
                      loaderClass={accent.loader}
                      message="Chargement des acteurs..."
                    />
                  ) : actors.length === 0 ? (
                    <div className="m-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-10 text-center sm:m-5 sm:py-12">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                        <Users className="h-7 w-7 text-slate-400" />
                      </div>
                      <p className="mt-3 text-sm font-medium text-slate-700">
                        Aucun acteur
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Ajoutez un acteur pour commencer
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDialogOpen(true)}
                        className="mt-4 border-slate-200"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter
                      </Button>
                    </div>
                  ) : (
                    <ul className="max-h-[min(70vh,480px)] divide-y divide-slate-100 overflow-y-auto">
                      {actors.map((actor) => (
                        <li key={actor.id}>
                          <div className="group flex items-start gap-3 p-3 transition-colors hover:bg-slate-50/80 sm:gap-3.5 sm:p-4">
                            <div
                              className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-semibold text-white shadow-sm sm:h-11 sm:w-11",
                                getAvatarColor(actor.name)
                              )}
                            >
                              {getInitials(actor.name)}
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="truncate font-medium text-slate-900">
                                {actor.name}
                              </p>
                              <div className="flex flex-col gap-0.5 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
                                <span className="inline-flex items-center gap-1 truncate">
                                  <Building2 className="h-3 w-3 shrink-0" />
                                  {actor.department}
                                </span>
                                <span className="hidden text-slate-300 sm:inline">
                                  ·
                                </span>
                                <span className="inline-flex items-center gap-1 truncate">
                                  <Briefcase className="h-3 w-3 shrink-0" />
                                  {actor.job}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(actor.id)}
                              aria-label={`Supprimer ${actor.name}`}
                              className="h-9 w-9 shrink-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Assignments */}
            <div className="lg:col-span-8 xl:col-span-9">
              <Card
                className={cn(
                  "overflow-hidden border shadow-sm",
                  embedded ? "border-violet-100" : "border-slate-200/80"
                )}
              >
                <CardHeader className="space-y-1 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10",
                          accent.statIcon
                        )}
                      >
                        <ClipboardList className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-slate-900 sm:text-lg">
                          Affectation aux actions
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Cochez les acteurs pour chaque action du plan
                        </CardDescription>
                      </div>
                    </div>
                    {planActions.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-slate-100 font-semibold text-slate-800"
                      >
                        {planActions.length} action
                        {planActions.length > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {isLoadingActions ? (
                    <LoadingState
                      loaderClass={accent.loader}
                      message="Chargement des actions..."
                    />
                  ) : planActions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center sm:py-16">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                        <Calendar className="h-7 w-7 text-slate-400" />
                      </div>
                      <p className="mt-3 text-sm font-medium text-slate-700">
                        Aucune action du plan
                      </p>
                      <p className="mx-auto mt-1 max-w-sm px-4 text-sm text-slate-500">
                        Créez des actions dans Plan d&apos;action pour les
                        affecter aux acteurs.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {planActions.map((action, index) => {
                        const assigned = (assignments[action.id] ?? []).length;
                        return (
                          <li
                            key={action.id}
                            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
                              <div
                                className={cn(
                                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                                  accent.step
                                )}
                              >
                                {index + 1}
                              </div>
                              <div className="min-w-0 flex-1 space-y-4">
                                <div>
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <h4 className="font-semibold leading-snug text-slate-900">
                                      {action.title}
                                    </h4>
                                    {assigned > 0 && (
                                      <Badge
                                        variant="secondary"
                                        className={cn(
                                          "w-fit shrink-0 text-xs font-medium",
                                          accent.badge
                                        )}
                                      >
                                        {assigned} acteur
                                        {assigned > 1 ? "s" : ""}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 sm:text-sm">
                                    <span className="inline-flex items-center gap-1.5">
                                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                                      {format(
                                        new Date(action.startDate),
                                        "dd MMM yyyy",
                                        { locale: fr }
                                      )}
                                    </span>
                                    <ChevronRight className="hidden h-4 w-4 text-slate-300 sm:block" />
                                    <span className="text-slate-400 sm:hidden">
                                      →
                                    </span>
                                    <span>
                                      {format(
                                        new Date(action.endDate),
                                        "dd MMM yyyy",
                                        { locale: fr }
                                      )}
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <Label className="mb-2.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">
                                    Acteurs affectés
                                  </Label>
                                  {actors.length === 0 ? (
                                    <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-500">
                                      Ajoutez des acteurs pour pouvoir les
                                      affecter.
                                    </p>
                                  ) : (
                                    <div className="flex flex-wrap gap-2">
                                      {actors.map((actor) => {
                                        const isChecked = (
                                          assignments[action.id] ?? []
                                        ).includes(actor.id);
                                        return (
                                          <label
                                            key={actor.id}
                                            className={cn(
                                              "flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition active:scale-[0.98]",
                                              isChecked
                                                ? accent.chipActive
                                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                            )}
                                          >
                                            <Checkbox
                                              checked={isChecked}
                                              onCheckedChange={(checked) =>
                                                handleActorCheckChange(
                                                  action.id,
                                                  actor.id,
                                                  checked === true
                                                )
                                              }
                                              className="data-[state=checked]:border-violet-600 data-[state=checked]:bg-violet-600"
                                            />
                                            <span className="font-medium leading-tight">
                                              {actor.name}
                                            </span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-slate-50/50 px-6 py-16 text-center sm:py-24",
              accent.emptyBorder
            )}
          >
            <div
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-2xl sm:h-20 sm:w-20",
                accent.emptyIconBg
              )}
            >
              <FolderKanban
                className={cn(
                  "h-8 w-8 sm:h-10 sm:w-10",
                  accent.emptyIconColor
                )}
              />
            </div>
            <h3 className="mt-5 text-base font-semibold text-slate-900 sm:text-lg">
              Sélectionnez un projet
            </h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Choisissez un projet actif pour gérer ses acteurs et les affecter
              aux actions du plan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingState({
  loaderClass,
  message,
}: {
  loaderClass: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20">
      <Loader2 className={cn("h-10 w-10 animate-spin", loaderClass)} />
      <p className="mt-3 text-sm text-slate-500">{message}</p>
    </div>
  );
}
