"use client";

import { useState, useEffect } from "react";
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
  Pencil,
  Send,
} from "lucide-react";
import type { CommunicationProjectListItem } from "@/lib/actions/communication-project";
import type { CommunicationProjectActor } from "@/lib/actions/communication-actor";
import type { PlanActionItem } from "@/lib/actions/communication-plan-action";
import {
  getPlanActionsByProjectId,
} from "@/lib/actions/communication-plan-action";
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

export default function ActeursRolesClient({
  initialProjects,
  embedded,
}: ActeursRolesClientProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [actors, setActors] = useState<CommunicationProjectActor[]>([]);
  const [planActions, setPlanActions] = useState<PlanActionItem[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [isLoadingActors, setIsLoadingActors] = useState(false);
  const [isLoadingActions, setIsLoadingActions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    job: "",
  });

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

  const loadActors = async (projectId: string) => {
    setIsLoadingActors(true);
    try {
      const response = await fetch(
        `/api/communication/actors?projectId=${projectId}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Erreur lors du chargement des acteurs";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Erreur ${response.status}: ${errorText || response.statusText}`;
        }
        toast.error(errorMessage);
        setActors([]);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setActors(data.actors);
      } else {
        toast.error("Erreur lors du chargement des acteurs");
        setActors([]);
      }
    } catch (error) {
      console.error("Error loading actors:", error);
      toast.error(
        error instanceof Error
          ? `Erreur réseau: ${error.message}`
          : "Erreur lors du chargement des acteurs."
      );
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

    if (!formData.name.trim()) {
      toast.error("Le nom de l'acteur est obligatoire");
      return;
    }

    if (!formData.department.trim()) {
      toast.error("Le département est obligatoire");
      return;
    }

    if (!formData.job.trim()) {
      toast.error("Le poste est obligatoire");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/communication/actors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          name: formData.name.trim(),
          department: formData.department.trim(),
          job: formData.job.trim(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Erreur lors de l'ajout de l'acteur";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Erreur ${response.status}: ${errorText || response.statusText}`;
        }
        toast.error(errorMessage);
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success("Acteur ajouté avec succès");
        setFormData({ name: "", department: "", job: "" });
        setDialogOpen(false);
        await loadActors(selectedProjectId);
      } else {
        toast.error(data.error || "Erreur lors de l'ajout de l'acteur");
      }
    } catch (error) {
      console.error("Error adding actor:", error);
      toast.error(
        error instanceof Error
          ? `Erreur réseau: ${error.message}`
          : "Erreur lors de l'ajout de l'acteur."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (actorId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet acteur ?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/communication/actors?actorId=${actorId}&projectId=${selectedProjectId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Erreur lors de la suppression de l'acteur";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Erreur ${response.status}: ${errorText || response.statusText}`;
        }
        toast.error(errorMessage);
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success("Acteur supprimé avec succès");
        await loadActors(selectedProjectId);
        await loadAssignments(selectedProjectId);
      } else {
        toast.error(data.error || "Erreur lors de la suppression de l'acteur");
      }
    } catch (error) {
      console.error("Error deleting actor:", error);
      toast.error(
        error instanceof Error
          ? `Erreur réseau: ${error.message}`
          : "Erreur lors de la suppression de l'acteur."
      );
    }
  };

  const handleAssignActors = async (
    actionId: string,
    actorIds: string[]
  ) => {
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

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-amber-500/90",
      "bg-teal-500/90",
      "bg-rose-500/90",
      "bg-indigo-500/90",
      "bg-emerald-500/90",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className={cn(embedded ? "" : "min-h-screen bg-stone-50/80")}>
      {!embedded && (
      <div className="relative overflow-hidden border-b border-stone-200/80 bg-white">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 mb-4">
                <Users className="h-3.5 w-3.5" />
                Gestion des équipes
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
                Acteurs et Rôles
              </h1>
              <p className="mt-2 max-w-2xl text-base text-stone-600">
                Gérez les acteurs de vos projets et affectez-les aux actions du
                plan de communication.
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      <div className={cn("mx-auto", embedded ? "max-w-full px-4 py-4 sm:px-6" : "max-w-7xl px-4 py-8 sm:px-6 lg:px-8")}>
        {/* Project selector */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <Label className="text-sm font-medium text-stone-700">
                Projet sélectionné
              </Label>
              <Select
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
              >
                <SelectTrigger className="mt-2 h-12 w-full max-w-md border-stone-200 bg-white text-base shadow-sm transition hover:border-stone-300 focus:ring-amber-500/20 sm:max-w-sm">
                  <FolderKanban className="h-5 w-5 text-stone-400 mr-2" />
                  <SelectValue placeholder="Choisir un projet..." />
                </SelectTrigger>
                <SelectContent>
                  {initialProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="rounded-full bg-stone-100 p-4">
                        <XCircle className="h-8 w-8 text-stone-400" />
                      </div>
                      <p className="mt-3 text-sm font-medium text-stone-700">
                        Aucun projet actif
                      </p>
                      <p className="mt-1 text-sm text-stone-500">
                        Créez un projet dans Communication → Projets
                      </p>
                    </div>
                  ) : (
                    initialProjects.map((project) => (
                      <SelectItem
                        key={project.id}
                        value={project.id}
                        className="py-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{project.name}</span>
                          <Badge
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-700 text-xs font-normal"
                          >
                            Actif
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {selectedProjectId && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="h-12 gap-2 bg-amber-600 px-6 text-white shadow-sm hover:bg-amber-700"
                  >
                    <UserPlus className="h-5 w-5" />
                    Ajouter un Acteur
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nouvel acteur</DialogTitle>
                    <DialogDescription>
                      Renseignez les informations de l&apos;acteur à ajouter au
                      projet.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="dialog-name">
                        Nom <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="dialog-name"
                        placeholder="Ex: Jean Dupont"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                        className="border-stone-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dialog-department">
                        Département <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="dialog-department"
                        placeholder="Ex: Marketing"
                        value={formData.department}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            department: e.target.value,
                          })
                        }
                        required
                        className="border-stone-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dialog-job">
                        Poste <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="dialog-job"
                        placeholder="Ex: Responsable Communication"
                        value={formData.job}
                        onChange={(e) =>
                          setFormData({ ...formData, job: e.target.value })
                        }
                        required
                        className="border-stone-200"
                      />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        className="border-stone-200"
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-amber-600 hover:bg-amber-700"
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

        {selectedProjectId ? (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Actors column */}
            <div className="lg:col-span-1">
              <Card className="border-stone-200/80 bg-white shadow-sm">
                <CardHeader className="space-y-1 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-stone-900">
                      Acteurs
                    </CardTitle>
                    {actors.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-stone-100 text-stone-900 font-medium"
                      >
                        {actors.length}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {selectedProject?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingActors ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                      <p className="mt-3 text-sm text-stone-500">
                        Chargement...
                      </p>
                    </div>
                  ) : actors.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/50 py-12 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100">
                        <Users className="h-7 w-7 text-stone-400" />
                      </div>
                      <p className="mt-3 text-sm font-medium text-stone-700">
                        Aucun acteur
                      </p>
                      <p className="mt-1 text-sm text-stone-500">
                        Ajoutez un acteur pour commencer
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDialogOpen(true)}
                        className="mt-4 border-stone-200"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {actors.map((actor) => (
                        <div
                          key={actor.id}
                          className="group flex items-center gap-3 rounded-lg border border-stone-100 bg-white p-3 transition hover:border-stone-200 hover:bg-stone-50/50"
                        >
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white",
                              getAvatarColor(actor.name)
                            )}
                          >
                            {getInitials(actor.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-stone-900">
                              {actor.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-stone-500">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {actor.department}
                              </span>
                              <span>·</span>
                              <span className="flex items-center gap-1 truncate">
                                <Briefcase className="h-3 w-3 shrink-0" />
                                {actor.job}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(actor.id)}
                            className="h-8 w-8 shrink-0 text-stone-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Actions assignation column */}
            <div className="lg:col-span-2">
              <Card className="border-stone-200/80 bg-white shadow-sm">
                <CardHeader className="space-y-1 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-stone-900">
                      Affectation aux actions
                    </CardTitle>
                    {planActions.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-stone-100 text-stone-900 font-medium"
                      >
                        {planActions.length} action(s)
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    Sélectionnez les acteurs pour chaque action du plan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingActions ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                      <p className="mt-3 text-sm text-stone-500">
                        Chargement des actions...
                      </p>
                    </div>
                  ) : planActions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/50 py-12 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100">
                        <Calendar className="h-7 w-7 text-stone-400" />
                      </div>
                      <p className="mt-3 text-sm font-medium text-stone-700">
                        Aucune action du plan
                      </p>
                      <p className="mt-1 max-w-sm mx-auto text-sm text-stone-500">
                        Créez des actions dans la section Mise en œuvre pour les
                        affecter aux acteurs.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {planActions.map((action, index) => (
                        <div
                          key={action.id}
                          className="relative rounded-xl border border-stone-200/80 bg-white p-4 shadow-sm transition hover:shadow-md"
                        >
                          <div className="flex gap-4">
                            <div className="flex shrink-0">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-800">
                                {index + 1}
                              </div>
                              
                            </div>

                            <div className="min-w-0 flex-1 space-y-4">
                             
                              <div>
                                <div className="flex items-center justify-between mx-3">
                                <h4 className="font-semibold text-stone-900">
                                  {action.title}
                                </h4>
                                <Button variant="ghost" size="icon">
                                  
                                  <Send className="h-4 w-4 text-amber-700 hover:text-amber-800" />
                                </Button>
                                </div>
                                <div className="mt-1 flex flex-wrap gap-4 text-sm text-stone-500">
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    {format(
                                      new Date(action.startDate),
                                      "dd MMM yyyy",
                                      { locale: fr }
                                    )}
                                  </span>
                                  <ChevronRight className="h-4 w-4 text-stone-300" />
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
                                <Label className="mb-2 block text-xs font-medium uppercase tracking-wider text-stone-500">
                                  Acteurs affectés
                                </Label>
                                {actors.length === 0 ? (
                                  <p className="text-sm text-stone-500">
                                    Aucun acteur disponible
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {actors.map((actor) => (
                                      <label
                                        key={actor.id}
                                        className={cn(
                                          "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
                                          (assignments[action.id] ?? []).includes(
                                            actor.id
                                          )
                                            ? "border-amber-300 bg-amber-50 text-amber-900"
                                            : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50"
                                        )}
                                      >
                                        <Checkbox
                                          checked={
                                            (assignments[action.id] ?? []).includes(
                                              actor.id
                                            )
                                          }
                                          onCheckedChange={(checked) =>
                                            handleActorCheckChange(
                                              action.id,
                                              actor.id,
                                              checked === true
                                            )
                                          }
                                        />
                                        <span className="font-medium">
                                          {actor.name}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 py-24">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-stone-100">
              <FolderKanban className="h-10 w-10 text-stone-400" />
            </div>
            <h3 className="mt-6 text-lg font-semibold text-stone-900">
              Sélectionnez un projet
            </h3>
            <p className="mt-2 max-w-sm text-center text-sm text-stone-500">
              Choisissez un projet actif dans le menu ci-dessus pour gérer ses
              acteurs et les affecter aux actions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
