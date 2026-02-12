"use client";

import { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  Edit2,
  CheckCircle2,
  Clock,
  Loader2,
  PlayCircle,
  CheckSquare,
  Sparkles,
  Save,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";

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
};

export default function MiseOeuvreClient({
  projects,
  initialActions,
  selectedProjectId: initialProjectId,
}: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    initialProjectId ?? (projects[0]?.id ?? null)
  );
  const [actions, setActions] = useState<PlanActionItem[]>(initialActions);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hasUnsavedCompleted, setHasUnsavedCompleted] = useState(false);
  const [savingCompleted, setSavingCompleted] = useState(false);
  const [saveCompletedDone, setSaveCompletedDone] = useState(false);
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
    getPlanActionsByProjectId(selectedProjectId)
      .then((res) => {
        setActions(res.success ? res.actions : []);
        setHasUnsavedCompleted(false);
        setSaveCompletedDone(false);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading actions:", error);
        toast.error("Erreur lors du chargement des actions. Veuillez réessayer.");
        setActions([]);
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
    try {
      const res = await createPlanAction(selectedProjectId, {
        title: form.title.trim(),
        startDate,
        endDate,
        completed: false,
      });
      if (res.success) {
        setActions((prev) => [...prev, res.action].sort((a, b) => a.orderIndex - b.orderIndex));
        resetForm();
        toast.success("Action ajoutée.");
      } else {
        toast.error(res.error || "Erreur lors de la création de l'action.");
      }
    } catch (error) {
      console.error("Error creating action:", error);
      toast.error("Erreur lors de la création. Veuillez réessayer.");
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
    try {
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
        toast.error(res.error || "Erreur lors de la mise à jour de l'action.");
      }
    } catch (error) {
      console.error("Error updating action:", error);
      toast.error("Erreur lors de la mise à jour. Veuillez réessayer.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deletePlanAction(id);
      if (res.success) {
        setActions((prev) => prev.filter((a) => a.id !== id));
        if (editingId === id) resetForm();
        toast.success("Action supprimée.");
      } else {
        toast.error(res.error || "Erreur lors de la suppression de l'action.");
      }
    } catch (error) {
      console.error("Error deleting action:", error);
      toast.error("Erreur lors de la suppression. Veuillez réessayer.");
    }
  };

  const handleToggleCompleted = (id: string, completed: boolean) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, completed } : a))
    );
    setHasUnsavedCompleted(true);
    setSaveCompletedDone(false);
  };

  const handleEnregistrerCompleted = async () => {
    const checkedActions = actions.filter((a) => a.completed);
    if (checkedActions.length === 0) {
      toast.error("Cochez au moins une action à enregistrer.");
      return;
    }
    setSavingCompleted(true);
    try {
      // Save only checked actions as completed in the database
      const results = await Promise.all(
        checkedActions.map((action) =>
          updatePlanAction(action.id, { completed: true })
        )
      );
      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        toast.error(
          `${failed.length} action(s) non enregistrée(s). Veuillez réessayer.`
        );
      } else {
        setHasUnsavedCompleted(false);
        setSaveCompletedDone(true);
        toast.success(
          `${checkedActions.length} action(s) enregistrée(s) comme terminée(s).`
        );
      }
    } catch (error) {
      console.error("Error saving completed actions:", error);
      toast.error("Erreur lors de l'enregistrement. Veuillez réessayer.");
    } finally {
      setSavingCompleted(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const completedCount = actions.filter((a) => a.completed).length;
  const pendingCount = actions.filter((a) => !a.completed).length;

  return (
    <div className="space-y-8 p-6">
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
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-sm">
                  <PlayCircle className="size-5" />
                </span>
                Suivi des Actions
              </h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Suivez l&apos;avancement de toutes les actions de votre projet. Cochez les actions terminées pour suivre votre progression.
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
                  <Badge variant="secondary" className="rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="size-3 mr-1" />
                    Terminées: {completedCount}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full bg-amber-100 text-amber-700">
                    <Clock className="size-3 mr-1" />
                    En cours: {pendingCount}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Card className="bg-white/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Projet
          </CardTitle>
          <CardDescription>
            Sélectionnez le projet pour lequel vous souhaitez suivre les actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-slate-50 p-5 text-slate-600">
              <div className="font-medium text-slate-800">Aucun projet trouvé.</div>
              <div className="mt-1 text-sm">
                Créez d&apos;abord un projet dans <span className="font-medium">Communication → Projets</span>,
                puis revenez ici pour suivre les actions.
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
        <Card className="bg-white/70 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="size-5" />
              Actions
              {selectedProject && (
                <span className="text-sm font-normal text-muted-foreground">
                  — {selectedProject.name}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Liste de toutes les actions du projet. Cochez les actions terminées.
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
                      <div className="font-medium text-slate-900">Aucune action pour ce projet.</div>
                      <div className="text-sm text-slate-600">
                        Ajoutez la première action pour commencer le suivi.
                      </div>
                      <Button
                        onClick={handleAdd}
                        className="mt-2 w-fit gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
                      >
                        <Plus className="size-4" />
                        Ajouter une action
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3">
                  {actions.map((action) => (
                    <div
                      key={action.id}
                      className={`group flex flex-wrap items-center gap-4 rounded-xl border p-4 shadow-sm transition hover:shadow-md ${
                        action.completed
                          ? "bg-emerald-50/70 border-emerald-200"
                          : "bg-white/70 border-slate-200"
                      }`}
                    >
                      {editingId === action.id ? (
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
                              onClick={handleSaveEdit}
                              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
                            >
                              Enregistrer
                            </Button>
                            <Button variant="outline" onClick={resetForm}>
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Checkbox
                              checked={action.completed}
                              onCheckedChange={(checked) =>
                                handleToggleCompleted(action.id, checked === true)
                              }
                              className="h-5 w-5"
                            />
                            <div className="min-w-0 flex-1">
                              <div
                                className={`font-medium truncate ${
                                  action.completed
                                    ? "text-emerald-700 line-through"
                                    : "text-slate-900"
                                }`}
                              >
                                {action.title}
                              </div>
                              <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-2">
                                <span className="flex items-center gap-1">
                                  <Clock className="size-3" />
                                  Début:{" "}
                                  {format(new Date(action.startDate), "dd MMM yyyy, HH:mm", {
                                    locale: fr,
                                  })}
                                </span>
                                <span className="text-slate-400">•</span>
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="size-3" />
                                  Fin:{" "}
                                  {format(new Date(action.endDate), "dd MMM yyyy, HH:mm", {
                                    locale: fr,
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(action)}
                            >
                              <Edit2 className="size-4 mr-1" />
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
                    </div>
                  ))}
                </div>

                {isAdding ? (
                  <div className="rounded-xl border border-dashed border-violet-300 bg-gradient-to-br from-violet-50/70 to-fuchsia-50/40 p-4">
                    <div className="flex flex-wrap items-end gap-3">
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
                          onClick={handleSaveNew}
                          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
                        >
                          Ajouter l&apos;action
                        </Button>
                        <Button variant="outline" onClick={resetForm}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {actions.length > 0 && (
                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      onClick={handleEnregistrerCompleted}
                      disabled={
                        savingCompleted ||
                        saveCompletedDone ||
                        actions.filter((a) => a.completed).length === 0
                      }
                      className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-50"
                    >
                      {savingCompleted ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Save className="size-4" />
                      )}
                      Enregistrer
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
