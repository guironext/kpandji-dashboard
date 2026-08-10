"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Hash,
  Loader2,
  Minus,
  Plus,
  Sparkles,
  Target,
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
import type { RoleMissionProjetRoutineListItem } from "@/lib/actions/role-mission-projet-routine";
import { createIndicateurObjectifMensuelProjetRoutineBatch } from "@/lib/actions/indicateur-objectif-mensuel-projet-routine";

const inputClass =
  "rounded-xl border-slate-200/90 bg-white shadow-sm transition focus-visible:border-emerald-300 focus-visible:ring-emerald-500/25";

type ObjectifDraft = {
  key: string;
  libelle: string;
  objectifMensuel: string;
  description: string;
  nombreObjectifsMensuels: number;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function createEmptyDraft(): ObjectifDraft {
  return {
    key: crypto.randomUUID(),
    libelle: "",
    objectifMensuel: "",
    description: "",
    nombreObjectifsMensuels: 1,
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: RoleMissionProjetRoutineListItem[];
  onSuccess?: () => void;
};

export default function AssignerObjectifMensuelDialog({
  open,
  onOpenChange,
  roles,
  onSuccess,
}: Props) {
  const [roleMissionId, setRoleMissionId] = useState("");
  const [objectifDrafts, setObjectifDrafts] = useState<ObjectifDraft[]>([createEmptyDraft()]);
  const [saving, setSaving] = useState(false);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === roleMissionId) ?? null,
    [roles, roleMissionId]
  );

  const selectedResponsable = selectedRole?.responsables[0] ?? null;

  useEffect(() => {
    if (!open) {
      setRoleMissionId("");
      setObjectifDrafts([createEmptyDraft()]);
      setSaving(false);
    }
  }, [open]);

  function updateDraft(key: string, patch: Partial<ObjectifDraft>) {
    setObjectifDrafts((prev) =>
      prev.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft))
    );
  }

  function addDraft() {
    setObjectifDrafts((prev) => [...prev, createEmptyDraft()]);
  }

  function removeDraft(key: string) {
    setObjectifDrafts((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((draft) => draft.key !== key);
    });
  }

  function adjustDraftCount(key: string, delta: number) {
    setObjectifDrafts((prev) =>
      prev.map((draft) =>
        draft.key === key
          ? { ...draft, nombreObjectifsMensuels: Math.max(0, draft.nombreObjectifsMensuels + delta) }
          : draft
      )
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!roleMissionId) {
      toast.error("Sélectionnez un rôle et mission.");
      return;
    }

    const validDrafts = objectifDrafts.filter(
      (d) => d.libelle.trim() || d.objectifMensuel.trim()
    );

    if (validDrafts.length === 0) {
      toast.error("Ajoutez au moins un objectif mensuel.");
      return;
    }

    for (let i = 0; i < validDrafts.length; i++) {
      const draft = validDrafts[i];
      if (!draft.libelle.trim()) {
        toast.error(`Objectif ${i + 1} : le libellé est obligatoire.`);
        return;
      }
      if (!draft.objectifMensuel.trim()) {
        toast.error(`Objectif ${i + 1} : l'objectif mensuel est obligatoire.`);
        return;
      }
    }

    setSaving(true);
    const result = await createIndicateurObjectifMensuelProjetRoutineBatch({
      roleMissionProjetRoutineId: roleMissionId,
      objectifs: validDrafts.map((draft) => ({
        libelle: draft.libelle.trim(),
        objectifMensuel: draft.objectifMensuel.trim(),
        description: draft.description.trim() || undefined,
        nombreObjectifsMensuels: draft.nombreObjectifsMensuels,
      })),
    });
    setSaving(false);

    if (result.success) {
      toast.success(
        result.createdCount > 1
          ? `${result.createdCount} objectifs mensuels assignés avec succès.`
          : "Objectif mensuel assigné avec succès."
      );
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(result.error);
    }
  }

  const filledDrafts = objectifDrafts.filter(
    (d) => d.libelle.trim() || d.objectifMensuel.trim()
  ).length;

  const canSubmit = Boolean(roleMissionId) && filledDrafts > 0 && !saving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-h-[min(96dvh,860px)] flex-col gap-0 overflow-hidden border-emerald-200/60 p-0",
          "fixed inset-x-0 bottom-0 top-auto max-w-none translate-x-0 translate-y-0 rounded-t-[1.75rem] rounded-b-none",
          "sm:inset-auto sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:max-w-2xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl"
        )}
      >
        <div className="relative shrink-0 overflow-hidden border-b border-emerald-100 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 px-4 pb-5 pt-5 sm:px-6 sm:pt-6">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.2),transparent_55%)]"
            aria-hidden
          />
          <DialogHeader className="relative space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white shadow-lg ring-1 ring-white/25 backdrop-blur-sm">
                <Target className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1 pr-8">
                <Badge className="mb-2 border-0 bg-white/20 text-white hover:bg-white/25">
                  Étape 2 · Objectifs multiples
                </Badge>
                <DialogTitle className="text-xl font-bold text-white sm:text-2xl">
                  Assigner Objectifs Mensuels
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm leading-relaxed text-emerald-50/95">
                  Choisissez un responsable, puis ajoutez plusieurs indicateurs en une seule
                  opération.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {roles.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center sm:px-6">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <Briefcase className="h-7 w-7" />
            </div>
            <p className="text-base font-semibold text-slate-900">Aucun rôle disponible</p>
            <p className="mt-2 max-w-sm text-sm text-slate-600">
              Créez d&apos;abord un rôle et mission à l&apos;étape 1.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-6 w-full rounded-xl sm:w-auto"
              onClick={() => onOpenChange(false)}
            >
              Fermer
            </Button>
          </div>
        ) : (
          <>
            <form
              id="assigner-objectif-form"
              onSubmit={handleSubmit}
              className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"
            >
              {/* Section 1 — Role */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    1
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900">Rôle et responsable</h3>
                </div>

                <div className="space-y-2 md:hidden">
                  <p className="text-xs text-slate-500">Sélectionnez un rôle *</p>
                  <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {roles.map((role) => {
                      const responsable = role.responsables[0];
                      const isActive = roleMissionId === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setRoleMissionId(role.id)}
                          className={cn(
                            "min-w-[11.5rem] shrink-0 snap-start rounded-2xl border p-3.5 text-left transition active:scale-[0.98]",
                            isActive
                              ? "border-transparent bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                              : "border-slate-200 bg-white shadow-sm hover:border-emerald-200"
                          )}
                        >
                          <p
                            className={cn(
                              "text-sm font-semibold leading-tight",
                              isActive ? "text-white" : "text-slate-900"
                            )}
                          >
                            {role.libelle}
                          </p>
                          {responsable && (
                            <p
                              className={cn(
                                "mt-1 truncate text-xs",
                                isActive ? "text-white/80" : "text-slate-500"
                              )}
                            >
                              {responsable.userName}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="hidden space-y-2 md:block">
                  <Label htmlFor="role-mission">Rôle et mission *</Label>
                  <Select value={roleMissionId || undefined} onValueChange={setRoleMissionId}>
                    <SelectTrigger id="role-mission" className={cn("h-11 w-full", inputClass)}>
                      <SelectValue placeholder="Sélectionner un rôle et mission" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {roles.map((role) => {
                        const responsable = role.responsables[0];
                        return (
                          <SelectItem key={role.id} value={role.id}>
                            <span className="flex flex-col items-start gap-0.5 py-0.5">
                              <span className="font-medium">{role.libelle}</span>
                              {responsable && (
                                <span className="text-xs text-slate-500">
                                  Responsable : {responsable.userName}
                                </span>
                              )}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {selectedResponsable && (
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 to-teal-50/50 p-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-md">
                      {initials(selectedResponsable.userName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                        Responsable assigné
                      </p>
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {selectedResponsable.userName}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {selectedResponsable.userEmail}
                      </p>
                    </div>
                    <UserCircle2 className="hidden h-5 w-5 shrink-0 text-emerald-500 sm:block" />
                  </div>
                )}
              </section>

              {/* Section 2 — Multiple objectifs */}
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      2
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Objectifs mensuels ({objectifDrafts.length})
                    </h3>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    onClick={addDraft}
                    disabled={!roleMissionId}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Ajouter
                  </Button>
                </div>

                <div className="space-y-3">
                  {objectifDrafts.map((draft, index) => (
                    <div
                      key={draft.key}
                      className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 ring-1 ring-slate-100"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <Badge
                          variant="outline"
                          className="rounded-full border-emerald-200 bg-white text-emerald-800"
                        >
                          Objectif {index + 1}
                        </Badge>
                        {objectifDrafts.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            onClick={() => removeDraft(draft.key)}
                            aria-label={`Supprimer l'objectif ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`libelle-${draft.key}`}>Libellé *</Label>
                          <Input
                            id={`libelle-${draft.key}`}
                            value={draft.libelle}
                            onChange={(e) => updateDraft(draft.key, { libelle: e.target.value })}
                            placeholder="Ex. Publications réseaux sociaux"
                            className={cn("h-11", inputClass)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`objectif-${draft.key}`}>Objectif mensuel *</Label>
                          <Textarea
                            id={`objectif-${draft.key}`}
                            value={draft.objectifMensuel}
                            onChange={(e) =>
                              updateDraft(draft.key, { objectifMensuel: e.target.value })
                            }
                            placeholder="Décrivez l'objectif à atteindre..."
                            className={cn("min-h-[80px] resize-none", inputClass)}
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`desc-${draft.key}`}>Description</Label>
                            <Textarea
                              id={`desc-${draft.key}`}
                              value={draft.description}
                              onChange={(e) =>
                                updateDraft(draft.key, { description: e.target.value })
                              }
                              placeholder="Optionnel"
                              className={cn("min-h-[72px] resize-none", inputClass)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Cible mensuelle *</Label>
                            <div className="flex h-[72px] items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-white px-3">
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 rounded-lg"
                                  onClick={() => adjustDraftCount(draft.key, -1)}
                                  disabled={draft.nombreObjectifsMensuels <= 0}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="min-w-[2rem] text-center text-lg font-bold text-emerald-800">
                                  {draft.nombreObjectifsMensuels}
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 rounded-lg"
                                  onClick={() => adjustDraftCount(draft.key, 1)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <Hash className="h-4 w-4 text-emerald-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full rounded-xl border-dashed border-emerald-300 bg-emerald-50/30 text-emerald-700 hover:bg-emerald-50"
                  onClick={addDraft}
                  disabled={!roleMissionId}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un autre objectif pour ce responsable
                </Button>

                {filledDrafts > 0 && selectedRole && (
                  <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      <Sparkles className="h-3.5 w-3.5" />
                      Aperçu — {filledDrafts} objectif{filledDrafts !== 1 ? "s" : ""} pour{" "}
                      {selectedResponsable?.userName ?? selectedRole.libelle}
                    </div>
                    <ul className="space-y-1.5">
                      {objectifDrafts
                        .filter((d) => d.libelle.trim() || d.objectifMensuel.trim())
                        .map((d, i) => (
                          <li key={d.key} className="text-sm text-slate-700">
                            <span className="font-semibold">{i + 1}.</span>{" "}
                            {d.libelle.trim() || "Sans libellé"} — cible {d.nombreObjectifsMensuels}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </section>
            </form>

            <div className="shrink-0 border-t border-slate-100 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
                  form="assigner-objectif-form"
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 shadow-md shadow-emerald-500/20 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 sm:w-auto"
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
                      Enregistrer {filledDrafts > 1 ? `les ${filledDrafts} objectifs` : "l'objectif"}
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
