"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ClipboardList,
  ListChecks,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  UserCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StatutTacheActiviteProjetRoutine } from "@prisma/client";
import type { ActiviteProjetRoutineListItem } from "@/lib/actions/activite-projet-routine";
import type { UserForRoleMissionOption } from "@/lib/actions/role-mission-projet-routine";
import { createTacheActiviteProjetRoutineBatch } from "@/lib/actions/tache-activite-projet-routine";

const inputClass =
  "rounded-xl border-slate-200/90 bg-white shadow-sm transition focus-visible:border-amber-300 focus-visible:ring-amber-500/25";

const STATUT_OPTIONS: { value: StatutTacheActiviteProjetRoutine; label: string }[] = [
  { value: "NOUVEAU", label: "Nouveau" },
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "EN_COURS", label: "En cours" },
  { value: "EN_ATTENTE_VALIDATION", label: "En attente validation" },
  { value: "VALIDEE", label: "Validée" },
  { value: "TERMINEE", label: "Terminée" },
  { value: "ANNULE", label: "Annulée" },
];

type TacheDraft = {
  key: string;
  activiteProjetRoutineId: string;
  userId: string;
  libelle: string;
  description: string;
  dateDebut: string;
  dateCloture: string;
  statutTache: StatutTacheActiviteProjetRoutine;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyDraft(defaultActiviteId = "", defaultUserId = ""): TacheDraft {
  return {
    key: crypto.randomUUID(),
    activiteProjetRoutineId: defaultActiviteId,
    userId: defaultUserId,
    libelle: "",
    description: "",
    dateDebut: todayInput(),
    dateCloture: "",
    statutTache: "NOUVEAU",
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activites: ActiviteProjetRoutineListItem[];
  users: UserForRoleMissionOption[];
  onSuccess?: () => void;
};

export default function AssignerTachesDialog({
  open,
  onOpenChange,
  activites,
  users,
  onSuccess,
}: Props) {
  const defaultActiviteId = activites[0]?.id ?? "";
  const defaultUserId = activites[0]?.responsable?.userId ?? users[0]?.id ?? "";

  const [tacheDrafts, setTacheDrafts] = useState<TacheDraft[]>([
    createEmptyDraft(defaultActiviteId, defaultUserId),
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setTacheDrafts([createEmptyDraft(defaultActiviteId, defaultUserId)]);
      setSaving(false);
    }
  }, [open, defaultActiviteId, defaultUserId]);

  function updateDraft(key: string, patch: Partial<TacheDraft>) {
    setTacheDrafts((prev) =>
      prev.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft))
    );
  }

  function addDraft() {
    setTacheDrafts((prev) => [...prev, createEmptyDraft(defaultActiviteId, defaultUserId)]);
  }

  function removeDraft(key: string) {
    setTacheDrafts((prev) => (prev.length <= 1 ? prev : prev.filter((d) => d.key !== key)));
  }

  function getActiviteLabel(activiteId: string) {
    const activite = activites.find((a) => a.id === activiteId);
    if (!activite) return "Activité";
    return `${activite.libelle}${activite.mois ? ` (${activite.mois})` : ""}`;
  }

  function getUserLabel(userId: string) {
    const user = users.find((u) => u.id === userId);
    return user?.name ?? "Responsable";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const validDrafts = tacheDrafts.filter((d) => d.libelle.trim() || d.description.trim());
    if (validDrafts.length === 0) {
      toast.error("Ajoutez au moins une tâche.");
      return;
    }

    for (let i = 0; i < validDrafts.length; i++) {
      const draft = validDrafts[i];
      if (!draft.libelle.trim()) {
        toast.error(`Tâche ${i + 1} : le libellé est obligatoire.`);
        return;
      }
      if (!draft.activiteProjetRoutineId) {
        toast.error(`Tâche ${i + 1} : sélectionnez une activité.`);
        return;
      }
      if (!draft.userId) {
        toast.error(`Tâche ${i + 1} : sélectionnez un responsable.`);
        return;
      }
      if (!draft.dateDebut) {
        toast.error(`Tâche ${i + 1} : la date de début est obligatoire.`);
        return;
      }
    }

    setSaving(true);
    const result = await createTacheActiviteProjetRoutineBatch({
      taches: validDrafts.map((draft) => ({
        activiteProjetRoutineId: draft.activiteProjetRoutineId,
        userId: draft.userId,
        libelle: draft.libelle.trim(),
        description: draft.description.trim() || undefined,
        dateDebut: draft.dateDebut,
        dateCloture: draft.dateCloture.trim() || null,
        statutTache: draft.statutTache,
      })),
    });
    setSaving(false);

    if (result.success) {
      toast.success(
        result.createdCount > 1
          ? `${result.createdCount} tâches créées avec succès.`
          : "Tâche créée avec succès."
      );
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(result.error);
    }
  }

  const filledDrafts = tacheDrafts.filter((d) => d.libelle.trim()).length;
  const canSubmit = filledDrafts > 0 && !saving;

  const activitesByRole = useMemo(() => {
    const map = new Map<string, ActiviteProjetRoutineListItem[]>();
    for (const activite of activites) {
      const key = activite.roleMissionLibelle;
      const existing = map.get(key) ?? [];
      existing.push(activite);
      map.set(key, existing);
    }
    return map;
  }, [activites]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-h-[min(96dvh,860px)] flex-col gap-0 overflow-hidden border-amber-200/60 p-0",
          "fixed inset-x-0 bottom-0 top-auto max-w-none translate-x-0 translate-y-0 rounded-t-[1.75rem] rounded-b-none",
          "sm:inset-auto sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:max-w-2xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl"
        )}
      >
        <div className="relative shrink-0 overflow-hidden border-b border-amber-100 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 px-4 pb-5 pt-5 sm:px-6 sm:pt-6">
          <DialogHeader className="relative space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white shadow-lg ring-1 ring-white/25 backdrop-blur-sm">
                <ListChecks className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1 pr-8">
                <Badge className="mb-2 border-0 bg-white/20 text-white hover:bg-white/25">
                  Étape 4 · Tâches
                </Badge>
                <DialogTitle className="text-xl font-bold text-white sm:text-2xl">
                  Assigner Tâches
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm leading-relaxed text-amber-50/95">
                  Créez une ou plusieurs tâches et liez-les à une activité avec un responsable.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {activites.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center sm:px-6">
            <ClipboardList className="mb-4 h-12 w-12 text-amber-500" />
            <p className="text-base font-semibold text-slate-900">Aucune activité disponible</p>
            <p className="mt-2 max-w-sm text-sm text-slate-600">
              Créez d&apos;abord des activités à l&apos;étape 3.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-6 rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Fermer
            </Button>
          </div>
        ) : (
          <>
            <form
              id="assigner-taches-form"
              onSubmit={handleSubmit}
              className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"
            >
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                      1
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Tâches ({tacheDrafts.length})
                    </h3>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
                    onClick={addDraft}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Ajouter
                  </Button>
                </div>

                <div className="space-y-3">
                  {tacheDrafts.map((draft, index) => {
                    const selectedActivite = activites.find(
                      (a) => a.id === draft.activiteProjetRoutineId
                    );
                    const selectedUser = users.find((u) => u.id === draft.userId);

                    return (
                      <div
                        key={draft.key}
                        className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 ring-1 ring-slate-100"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className="rounded-full border-amber-200 bg-white text-amber-800"
                          >
                            Tâche {index + 1}
                          </Badge>
                          {tacheDrafts.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                              onClick={() => removeDraft(draft.key)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label>Activité liée *</Label>
                            <Select
                              value={draft.activiteProjetRoutineId || undefined}
                              onValueChange={(v) => {
                                const activite = activites.find((a) => a.id === v);
                                updateDraft(draft.key, {
                                  activiteProjetRoutineId: v,
                                  userId:
                                    draft.userId ||
                                    activite?.responsable?.userId ||
                                    defaultUserId,
                                });
                              }}
                            >
                              <SelectTrigger className={cn("h-11 w-full", inputClass)}>
                                <SelectValue placeholder="Sélectionner une activité" />
                              </SelectTrigger>
                              <SelectContent className="max-h-64">
                                {Array.from(activitesByRole.entries()).map(
                                  ([roleLabel, roleActivites]) => (
                                    <div key={roleLabel}>
                                      <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">
                                        {roleLabel}
                                      </div>
                                      {roleActivites.map((activite) => (
                                        <SelectItem key={activite.id} value={activite.id}>
                                          {activite.libelle}
                                          {activite.mois ? ` — ${activite.mois}` : ""}
                                        </SelectItem>
                                      ))}
                                    </div>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Responsable *</Label>
                            <Select
                              value={draft.userId || undefined}
                              onValueChange={(v) => updateDraft(draft.key, { userId: v })}
                            >
                              <SelectTrigger className={cn("h-11 w-full", inputClass)}>
                                <SelectValue placeholder="Sélectionner un responsable" />
                              </SelectTrigger>
                              <SelectContent className="max-h-64">
                                {users.map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name} — {user.roleLabel}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {selectedActivite && selectedUser && (
                            <div className="flex items-center gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/60 p-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-xs font-bold text-white">
                                {initials(selectedUser.name)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                                  {selectedActivite.roleMissionLibelle}
                                </p>
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {selectedUser.name}
                                </p>
                                <p className="truncate text-xs text-slate-500">
                                  Activité : {selectedActivite.libelle}
                                </p>
                              </div>
                              <UserCircle2 className="hidden h-5 w-5 text-amber-500 sm:block" />
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label>Libellé *</Label>
                            <Input
                              value={draft.libelle}
                              onChange={(e) => updateDraft(draft.key, { libelle: e.target.value })}
                              placeholder="Ex. Rédiger le contenu du post"
                              className={cn("h-11", inputClass)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              value={draft.description}
                              onChange={(e) =>
                                updateDraft(draft.key, { description: e.target.value })
                              }
                              placeholder="Détails de la tâche..."
                              className={cn("min-h-[72px] resize-none", inputClass)}
                            />
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Date de début *</Label>
                              <Input
                                type="date"
                                value={draft.dateDebut}
                                onChange={(e) =>
                                  updateDraft(draft.key, { dateDebut: e.target.value })
                                }
                                className={cn("h-11", inputClass)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Date de clôture</Label>
                              <Input
                                type="date"
                                value={draft.dateCloture}
                                min={draft.dateDebut || undefined}
                                onChange={(e) =>
                                  updateDraft(draft.key, { dateCloture: e.target.value })
                                }
                                className={cn("h-11", inputClass)}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Statut</Label>
                            <Select
                              value={draft.statutTache}
                              onValueChange={(v) =>
                                updateDraft(draft.key, {
                                  statutTache: v as StatutTacheActiviteProjetRoutine,
                                })
                              }
                            >
                              <SelectTrigger className={cn("h-11 w-full", inputClass)}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUT_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full rounded-xl border-dashed border-amber-300 bg-amber-50/30 text-amber-700 hover:bg-amber-50"
                  onClick={addDraft}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une autre tâche
                </Button>

                {filledDrafts > 0 && (
                  <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/40 p-4">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
                      <Sparkles className="h-3.5 w-3.5" />
                      Aperçu — {filledDrafts} tâche{filledDrafts !== 1 ? "s" : ""}
                    </div>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {tacheDrafts
                        .filter((d) => d.libelle.trim())
                        .map((d, i) => (
                          <li key={d.key}>
                            {i + 1}. {d.libelle} → {getActiviteLabel(d.activiteProjetRoutineId)} (
                            {getUserLabel(d.userId)})
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </section>
            </form>

            <div className="shrink-0 border-t border-slate-100 bg-white/95 px-4 py-4 sm:px-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full rounded-xl sm:w-auto"
                  onClick={() => onOpenChange(false)}
                  disabled={saving}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  form="assigner-taches-form"
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 shadow-md sm:w-auto"
                  disabled={!canSubmit}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Enregistrer {filledDrafts > 1 ? `les ${filledDrafts} tâches` : "la tâche"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
