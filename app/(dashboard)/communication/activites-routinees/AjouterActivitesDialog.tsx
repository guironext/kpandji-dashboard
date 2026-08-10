"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Briefcase,
  CalendarRange,
  ClipboardList,
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
import type { StatutActiviteProjetRoutine } from "@prisma/client";
import type { RoleMissionProjetRoutineListItem } from "@/lib/actions/role-mission-projet-routine";
import { createActiviteProjetRoutineBatch } from "@/lib/actions/activite-projet-routine";

const inputClass =
  "rounded-xl border-slate-200/90 bg-white shadow-sm transition focus-visible:border-violet-300 focus-visible:ring-violet-500/25";

const STATUT_OPTIONS: { value: StatutActiviteProjetRoutine; label: string }[] = [
  { value: "NOUVEAU", label: "Nouveau" },
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "EN_COURS", label: "En cours" },
  { value: "EN_ATTENTE_VALIDATION", label: "En attente validation" },
  { value: "VALIDEE", label: "Validée" },
  { value: "TERMINEE", label: "Terminée" },
  { value: "ANNULE", label: "Annulée" },
];

type ActiviteDraft = {
  key: string;
  libelle: string;
  description: string;
  dateDebut: string;
  dateCloture: string;
  statutActivite: StatutActiviteProjetRoutine;
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

function createEmptyDraft(): ActiviteDraft {
  return {
    key: crypto.randomUUID(),
    libelle: "",
    description: "",
    dateDebut: todayInput(),
    dateCloture: "",
    statutActivite: "NOUVEAU",
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: RoleMissionProjetRoutineListItem[];
  onSuccess?: () => void;
};

export default function AjouterActivitesDialog({ open, onOpenChange, roles, onSuccess }: Props) {
  const [roleMissionId, setRoleMissionId] = useState("");
  const [activiteDrafts, setActiviteDrafts] = useState<ActiviteDraft[]>([createEmptyDraft()]);
  const [saving, setSaving] = useState(false);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === roleMissionId) ?? null,
    [roles, roleMissionId]
  );

  const selectedResponsable = selectedRole?.responsables[0] ?? null;

  useEffect(() => {
    if (!open) {
      setRoleMissionId("");
      setActiviteDrafts([createEmptyDraft()]);
      setSaving(false);
    }
  }, [open]);

  function updateDraft(key: string, patch: Partial<ActiviteDraft>) {
    setActiviteDrafts((prev) =>
      prev.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft))
    );
  }

  function addDraft() {
    setActiviteDrafts((prev) => [...prev, createEmptyDraft()]);
  }

  function removeDraft(key: string) {
    setActiviteDrafts((prev) => (prev.length <= 1 ? prev : prev.filter((d) => d.key !== key)));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!roleMissionId) {
      toast.error("Sélectionnez un rôle et mission.");
      return;
    }

    const validDrafts = activiteDrafts.filter((d) => d.libelle.trim() || d.description.trim());
    if (validDrafts.length === 0) {
      toast.error("Ajoutez au moins une activité.");
      return;
    }

    for (let i = 0; i < validDrafts.length; i++) {
      if (!validDrafts[i].libelle.trim()) {
        toast.error(`Activité ${i + 1} : le libellé est obligatoire.`);
        return;
      }
      if (!validDrafts[i].dateDebut) {
        toast.error(`Activité ${i + 1} : la date de début est obligatoire.`);
        return;
      }
    }

    setSaving(true);
    const result = await createActiviteProjetRoutineBatch({
      roleMissionProjetRoutineId: roleMissionId,
      activites: validDrafts.map((draft) => ({
        libelle: draft.libelle.trim(),
        description: draft.description.trim() || undefined,
        dateDebut: draft.dateDebut,
        dateCloture: draft.dateCloture.trim() || null,
        statutActivite: draft.statutActivite,
      })),
    });
    setSaving(false);

    if (result.success) {
      toast.success(
        result.createdCount > 1
          ? `${result.createdCount} activités créées avec succès.`
          : "Activité créée avec succès."
      );
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(result.error);
    }
  }

  const filledDrafts = activiteDrafts.filter((d) => d.libelle.trim()).length;
  const canSubmit = Boolean(roleMissionId) && filledDrafts > 0 && !saving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-h-[min(96dvh,860px)] flex-col gap-0 overflow-hidden border-violet-200/60 p-0",
          "fixed inset-x-0 bottom-0 top-auto max-w-none translate-x-0 translate-y-0 rounded-t-[1.75rem] rounded-b-none",
          "sm:inset-auto sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:max-w-2xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl"
        )}
      >
        <div className="relative shrink-0 overflow-hidden border-b border-violet-100 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 px-4 pb-5 pt-5 sm:px-6 sm:pt-6">
          <DialogHeader className="relative space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white shadow-lg ring-1 ring-white/25 backdrop-blur-sm">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1 pr-8">
                <Badge className="mb-2 border-0 bg-white/20 text-white hover:bg-white/25">
                  Étape 3 · Activités
                </Badge>
                <DialogTitle className="text-xl font-bold text-white sm:text-2xl">
                  Ajouter Activités
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm leading-relaxed text-violet-50/95">
                  Planifiez une ou plusieurs activités routinières pour le responsable sélectionné.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {roles.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center sm:px-6">
            <Briefcase className="mb-4 h-12 w-12 text-amber-500" />
            <p className="text-base font-semibold text-slate-900">Aucun rôle disponible</p>
            <p className="mt-2 max-w-sm text-sm text-slate-600">
              Créez d&apos;abord un rôle et mission à l&apos;étape 1.
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
              id="ajouter-activites-form"
              onSubmit={handleSubmit}
              className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"
            >
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                    1
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900">Rôle et responsable</h3>
                </div>

                <div className="space-y-2 md:hidden">
                  <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {roles.map((role) => {
                      const isActive = roleMissionId === role.id;
                      const responsable = role.responsables[0];
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setRoleMissionId(role.id)}
                          className={cn(
                            "min-w-[11.5rem] shrink-0 snap-start rounded-2xl border p-3.5 text-left transition active:scale-[0.98]",
                            isActive
                              ? "border-transparent bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 text-white shadow-lg"
                              : "border-slate-200 bg-white shadow-sm"
                          )}
                        >
                          <p className="text-sm font-semibold">{role.libelle}</p>
                          {responsable && (
                            <p className={cn("mt-1 truncate text-xs", isActive ? "text-white/80" : "text-slate-500")}>
                              {responsable.userName}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="hidden md:block">
                  <Select value={roleMissionId || undefined} onValueChange={setRoleMissionId}>
                    <SelectTrigger className={cn("h-11 w-full", inputClass)}>
                      <SelectValue placeholder="Sélectionner un rôle et mission" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.libelle}
                          {role.responsables[0] ? ` — ${role.responsables[0].userName}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedResponsable && (
                  <div className="flex items-center gap-3 rounded-2xl border border-violet-200/80 bg-violet-50/60 p-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-bold text-white">
                      {initials(selectedResponsable.userName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                        Responsable
                      </p>
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {selectedResponsable.userName}
                      </p>
                      <p className="truncate text-xs text-slate-500">{selectedResponsable.userEmail}</p>
                    </div>
                    <UserCircle2 className="hidden h-5 w-5 text-violet-500 sm:block" />
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                      2
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Activités ({activiteDrafts.length})
                    </h3>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50"
                    onClick={addDraft}
                    disabled={!roleMissionId}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Ajouter
                  </Button>
                </div>

                <div className="space-y-3">
                  {activiteDrafts.map((draft, index) => (
                    <div
                      key={draft.key}
                      className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 ring-1 ring-slate-100"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <Badge variant="outline" className="rounded-full border-violet-200 bg-white text-violet-800">
                          Activité {index + 1}
                        </Badge>
                        {activiteDrafts.length > 1 && (
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
                          <Label>Libellé *</Label>
                          <Input
                            value={draft.libelle}
                            onChange={(e) => updateDraft(draft.key, { libelle: e.target.value })}
                            placeholder="Ex. Campagne réseaux sociaux"
                            className={cn("h-11", inputClass)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={draft.description}
                            onChange={(e) => updateDraft(draft.key, { description: e.target.value })}
                            placeholder="Détails de l'activité..."
                            className={cn("min-h-[72px] resize-none", inputClass)}
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Date de début *</Label>
                            <Input
                              type="date"
                              value={draft.dateDebut}
                              onChange={(e) => updateDraft(draft.key, { dateDebut: e.target.value })}
                              className={cn("h-11", inputClass)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Date de clôture</Label>
                            <Input
                              type="date"
                              value={draft.dateCloture}
                              min={draft.dateDebut || undefined}
                              onChange={(e) => updateDraft(draft.key, { dateCloture: e.target.value })}
                              className={cn("h-11", inputClass)}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Statut</Label>
                          <Select
                            value={draft.statutActivite}
                            onValueChange={(v) =>
                              updateDraft(draft.key, {
                                statutActivite: v as StatutActiviteProjetRoutine,
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
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full rounded-xl border-dashed border-violet-300 bg-violet-50/30 text-violet-700 hover:bg-violet-50"
                  onClick={addDraft}
                  disabled={!roleMissionId}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une autre activité
                </Button>

                {filledDrafts > 0 && selectedRole && (
                  <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 p-4">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-violet-700">
                      <Sparkles className="h-3.5 w-3.5" />
                      Aperçu — {filledDrafts} activité{filledDrafts !== 1 ? "s" : ""}
                    </div>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {activiteDrafts
                        .filter((d) => d.libelle.trim())
                        .map((d, i) => (
                          <li key={d.key}>
                            {i + 1}. {d.libelle} —{" "}
                            {d.dateDebut
                              ? format(new Date(d.dateDebut), "d MMM yyyy", { locale: fr })
                              : "sans date"}
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
                  form="ajouter-activites-form"
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 shadow-md sm:w-auto"
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
                      Enregistrer {filledDrafts > 1 ? `les ${filledDrafts} activités` : "l'activité"}
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
