"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  CalendarRange,
  Car,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Tag,
  Target,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getUsersForProjectActors } from "@/lib/actions/communication-actor";
import { getAllModele } from "@/lib/actions/modele";
import {
  createFinanceProjet,
  updateFinanceProjet,
  type FinanceProjetInput,
  type FinanceProjetListItem,
} from "@/lib/actions/finance-projet";
import type { StatutFinanceProjet } from "@/lib/finance-projet-statut";

const STATUT_OPTIONS: {
  value: StatutFinanceProjet;
  label: string;
  dot: string;
  active: string;
}[] = [
  {
    value: "BROUILLON",
    label: "Brouillon",
    dot: "bg-slate-400",
    active: "border-slate-300 bg-slate-50 ring-slate-200",
  },
  {
    value: "EN_COURS",
    label: "En cours",
    dot: "bg-teal-500",
    active: "border-teal-300 bg-teal-50 ring-teal-200",
  },
  {
    value: "EN_PAUSE",
    label: "En pause",
    dot: "bg-amber-500",
    active: "border-amber-300 bg-amber-50 ring-amber-200",
  },
  {
    value: "VALIDE",
    label: "Validé",
    dot: "bg-sky-500",
    active: "border-sky-300 bg-sky-50 ring-sky-200",
  },
  {
    value: "TERMINE",
    label: "Terminé",
    dot: "bg-emerald-500",
    active: "border-emerald-300 bg-emerald-50 ring-emerald-200",
  },
  {
    value: "ANNULE",
    label: "Annulé",
    dot: "bg-rose-500",
    active: "border-rose-300 bg-rose-50 ring-rose-200",
  },
];

const inputClass =
  "h-11 rounded-xl border-slate-200/90 bg-white shadow-sm transition focus-visible:border-teal-300 focus-visible:ring-teal-500/25";

type UserOption = { id: string; name: string; job: string; department: string };
type ModeleOption = { id: string; model: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: FinanceProjetListItem | null;
  onSuccess?: (project: FinanceProjetListItem) => void;
};

const emptyForm = (): FinanceProjetInput => ({
  nom: "",
  description: "",
  objectifVolumeAffaire: "",
  dateDebut: new Date().toISOString().slice(0, 10),
  dateFin: "",
  statut: "BROUILLON",
  responsableIds: [],
  modeleIds: [],
  objectifs: [""],
});

function projectToForm(project: FinanceProjetListItem): FinanceProjetInput {
  return {
    nom: project.nom,
    description: project.description ?? "",
    objectifVolumeAffaire: project.objectifVolumeAffaire ?? "",
    dateDebut: project.dateDebut.slice(0, 10),
    dateFin: project.dateFin ? project.dateFin.slice(0, 10) : "",
    statut: project.statut,
    responsableIds: project.responsables.map((r) => r.id),
    modeleIds: project.modelesCibles.map((m) => m.id),
    objectifs: project.objectifs?.length ? project.objectifs : [""],
  };
}

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof FileText;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-100/80 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function FinanceProjetFormDialog({
  open,
  onOpenChange,
  project = null,
  onSuccess,
}: Props) {
  const isEditing = Boolean(project);
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [form, setForm] = useState<FinanceProjetInput>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [modeles, setModeles] = useState<ModeleOption[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [modeleSearch, setModeleSearch] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(project ? projectToForm(project) : emptyForm());
    setUserSearch("");
    setModeleSearch("");
    setLoadingOptions(true);

    Promise.all([getUsersForProjectActors(), getAllModele()])
      .then(([usersResult, modelesResult]) => {
        if (usersResult.success) {
          setUsers(usersResult.users);
        }
        if (modelesResult.success && modelesResult.data) {
          setModeles(
            modelesResult.data.map((m) => ({ id: m.id, model: m.model }))
          );
        }
      })
      .catch((error) => {
        console.error("FinanceProjetFormDialog options:", error);
      })
      .finally(() => setLoadingOptions(false));
  }, [open, project]);

  const updateField = <K extends keyof FinanceProjetInput>(
    field: K,
    value: FinanceProjetInput[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.job.toLowerCase().includes(query) ||
        user.department.toLowerCase().includes(query)
    );
  }, [users, userSearch]);

  const filteredModeles = useMemo(() => {
    const query = modeleSearch.trim().toLowerCase();
    if (!query) return modeles;
    return modeles.filter((modele) =>
      modele.model.toLowerCase().includes(query)
    );
  }, [modeles, modeleSearch]);

  const toggleId = (
    field: "responsableIds" | "modeleIds",
    id: string,
    checked: boolean
  ) => {
    const current = form[field] ?? [];
    updateField(
      field,
      checked ? [...current, id] : current.filter((item) => item !== id)
    );
  };

  const updateObjectif = (index: number, value: string) => {
    const next = [...(form.objectifs ?? [])];
    next[index] = value;
    updateField("objectifs", next);
  };

  const addObjectif = () => {
    updateField("objectifs", [...(form.objectifs ?? []), ""]);
  };

  const removeObjectif = (index: number) => {
    const next = (form.objectifs ?? []).filter((_, i) => i !== index);
    updateField("objectifs", next.length ? next : [""]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isEditing) {
      if (!clerkLoaded) {
        toast.error("Chargement de la session, veuillez réessayer.");
        return;
      }
      if (!clerkUser?.id) {
        toast.error("Vous devez être connecté pour créer un projet.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: FinanceProjetInput = {
        ...form,
        dateFin: form.dateFin?.trim() ? form.dateFin : null,
        objectifs: (form.objectifs ?? []).map((titre) => titre.trim()).filter(Boolean),
      };

      const result = isEditing && project
        ? await updateFinanceProjet(project.id, payload)
        : await createFinanceProjet(payload, clerkUser?.id);

      if (result.success) {
        toast.success(isEditing ? "Projet mis à jour." : "Projet créé avec succès.");
        onSuccess?.(result.project);
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Erreur lors de l'enregistrement.");
      }
    } catch (error) {
      console.error("FinanceProjetFormDialog submit:", error);
      toast.error(
        isEditing
          ? "Erreur lors de la mise à jour du projet."
          : "Erreur lors de la création du projet."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-h-[min(92dvh,880px)] w-[calc(100%-1rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl sm:w-full",
          "top-auto bottom-0 translate-y-0 sm:top-[50%] sm:bottom-auto sm:translate-y-[-50%]",
          "data-[state=open]:slide-in-from-bottom-4 sm:data-[state=open]:slide-in-from-bottom-0"
        )}
      >
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-teal-700 via-emerald-700 to-slate-800 px-5 pb-5 pt-6 sm:px-6 sm:pb-6">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.18),transparent_50%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-full bg-amber-400/20 blur-2xl"
            aria-hidden
          />

          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm">
              {isEditing ? <Pencil className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
            </div>
            <div className="min-w-0 flex-1 pr-8">
              <DialogTitle className="text-left text-xl font-bold text-white sm:text-2xl">
                {isEditing ? "Modifier le projet" : "Créer un nouveau projet"}
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-left text-sm text-white/85">
                {isEditing
                  ? "Mettez à jour le nom, le calendrier, l'objectif d'affaires et les cibles du projet."
                  : "Renseignez le nom, le calendrier, l'objectif d'affaires et les cibles du projet finance."}
              </DialogDescription>
            </div>
          </div>

          <div className="relative mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white/90 ring-1 ring-white/20">
              {isEditing ? (
                <>
                  <Pencil className="h-3 w-3 text-amber-300" />
                  Édition
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 text-amber-300" />
                  Nouveau projet
                </>
              )}
            </span>
            <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 ring-1 ring-white/15">
              * Champs obligatoires
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-slate-50/80 to-white px-4 py-4 sm:px-5 sm:py-5">
            <div className="space-y-4">
              <FormSection
                icon={FileText}
                title="Informations générales"
                description="Nom et description du projet commercial"
              >
                <div className="space-y-2">
                  <Label htmlFor="finance-projet-nom" className="text-slate-700">
                    Nom du projet <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="finance-projet-nom"
                    className={inputClass}
                    value={form.nom}
                    onChange={(e) => updateField("nom", e.target.value)}
                    placeholder="Ex. Campagne flotte institutions Q1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="finance-projet-description" className="text-slate-700">
                    Description
                    <span className="ml-1 text-xs font-normal text-slate-400">(optionnel)</span>
                  </Label>
                  <Textarea
                    id="finance-projet-description"
                    className="min-h-[96px] resize-y rounded-xl border-slate-200/90 bg-white shadow-sm focus-visible:border-teal-300 focus-visible:ring-teal-500/25"
                    value={form.description ?? ""}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Contexte, périmètre et enjeu commercial..."
                  />
                </div>
              </FormSection>

              <FormSection
                icon={Wallet}
                title="Objectif de volume d'affaires"
                description="Montant cible en FCFA"
              >
                <div className="space-y-2">
                  <Label htmlFor="finance-projet-volume" className="text-slate-700">
                    Volume d&apos;affaires visé
                  </Label>
                  <Input
                    id="finance-projet-volume"
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    value={form.objectifVolumeAffaire ?? ""}
                    onChange={(e) =>
                      updateField("objectifVolumeAffaire", e.target.value)
                    }
                    placeholder="Ex. 250000000"
                  />
                </div>
              </FormSection>

              <FormSection
                icon={CalendarRange}
                title="Calendrier"
                description="Dates de début et de fin prévue"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="finance-projet-debut" className="text-slate-700">
                      Date de début <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="finance-projet-debut"
                      type="date"
                      className={inputClass}
                      value={form.dateDebut}
                      onChange={(e) => updateField("dateDebut", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="finance-projet-fin" className="text-slate-700">
                      Date de fin
                      <span className="ml-1 text-xs font-normal text-slate-400">(optionnel)</span>
                    </Label>
                    <Input
                      id="finance-projet-fin"
                      type="date"
                      className={inputClass}
                      value={form.dateFin ?? ""}
                      onChange={(e) => updateField("dateFin", e.target.value)}
                      min={form.dateDebut || undefined}
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection
                icon={Tag}
                title="Statut"
                description={isEditing ? "État actuel du projet" : "État du projet à la création"}
              >
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {STATUT_OPTIONS.map((option) => {
                    const selected = (form.statut ?? "BROUILLON") === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField("statut", option.value)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-center transition-all",
                          selected
                            ? cn("ring-2", option.active)
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <span className={cn("h-2.5 w-2.5 rounded-full", option.dot)} />
                        <span
                          className={cn(
                            "text-xs font-semibold leading-tight",
                            selected ? "text-slate-800" : "text-slate-600"
                          )}
                        >
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </FormSection>

              <FormSection
                icon={Users}
                title="Responsables"
                description="Personnes en charge du projet"
              >
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Rechercher un responsable..."
                  className={inputClass}
                />
                <div className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/40 p-2">
                  {loadingOptions ? (
                    <div className="flex items-center justify-center py-8 text-sm text-slate-500">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-teal-600" />
                      Chargement...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-500">
                      Aucun utilisateur trouvé.
                    </p>
                  ) : (
                    filteredUsers.map((user) => {
                      const checked = (form.responsableIds ?? []).includes(user.id);
                      return (
                        <label
                          key={user.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-all",
                            checked
                              ? "border-teal-300 bg-white shadow-sm ring-1 ring-teal-200"
                              : "border-transparent bg-white/80 hover:border-slate-200 hover:bg-white"
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              toggleId("responsableIds", user.id, value === true)
                            }
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-900">
                              {user.name}
                            </span>
                            <span className="block truncate text-xs text-slate-500">
                              {user.job} · {user.department}
                            </span>
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </FormSection>

              <FormSection
                icon={Car}
                title="Modèles ciblés"
                description="Véhicules visés par ce projet"
              >
                <Input
                  value={modeleSearch}
                  onChange={(e) => setModeleSearch(e.target.value)}
                  placeholder="Rechercher un modèle..."
                  className={inputClass}
                />
                <div className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/40 p-2">
                  {loadingOptions ? (
                    <div className="flex items-center justify-center py-8 text-sm text-slate-500">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-teal-600" />
                      Chargement...
                    </div>
                  ) : filteredModeles.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-500">
                      Aucun modèle trouvé.
                    </p>
                  ) : (
                    filteredModeles.map((modele) => {
                      const checked = (form.modeleIds ?? []).includes(modele.id);
                      return (
                        <label
                          key={modele.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-all",
                            checked
                              ? "border-amber-300 bg-white shadow-sm ring-1 ring-amber-200"
                              : "border-transparent bg-white/80 hover:border-slate-200 hover:bg-white"
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              toggleId("modeleIds", modele.id, value === true)
                            }
                          />
                          <span className="truncate text-sm font-medium text-slate-800">
                            {modele.model}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </FormSection>

              <FormSection
                icon={Target}
                title="Objectifs"
                description="Jalons ou résultats attendus"
              >
                <div className="space-y-2">
                  {(form.objectifs ?? [""]).map((titre, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        className={inputClass}
                        value={titre}
                        onChange={(e) => updateObjectif(index, e.target.value)}
                        placeholder={`Objectif ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 shrink-0 text-slate-400 hover:text-rose-600"
                        onClick={() => removeObjectif(index)}
                        aria-label="Retirer cet objectif"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-teal-200 text-teal-800 hover:bg-teal-50"
                  onClick={addObjectif}
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un objectif
                </Button>
              </FormSection>
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200/80 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-5">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl border-slate-200 sm:min-w-[7.5rem]"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-700 shadow-lg shadow-teal-500/20 hover:from-teal-700 hover:to-emerald-800 sm:min-w-[9.5rem]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : isEditing ? (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
