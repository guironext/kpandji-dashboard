"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  CalendarRange,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Tag,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createProjetPonctuel,
  type ProjetPonctuelInput,
  type ProjetPonctuelListItem,
} from "@/lib/actions/projet-ponctuel";

const STATUT_OPTIONS = [
  {
    value: "EN_ATTENTE",
    label: "En attente",
    dot: "bg-slate-400",
    active: "border-slate-300 bg-slate-50 ring-slate-200",
    pill: "bg-slate-100 text-slate-700",
  },
  {
    value: "EN_COURS",
    label: "En cours",
    dot: "bg-sky-500",
    active: "border-sky-300 bg-sky-50 ring-sky-200",
    pill: "bg-sky-100 text-sky-800",
  },
  {
    value: "TERMINEE",
    label: "Terminée",
    dot: "bg-emerald-500",
    active: "border-emerald-300 bg-emerald-50 ring-emerald-200",
    pill: "bg-emerald-100 text-emerald-800",
  },
  {
    value: "ANNULE",
    label: "Annulée",
    dot: "bg-rose-500",
    active: "border-rose-300 bg-rose-50 ring-rose-200",
    pill: "bg-rose-100 text-rose-800",
  },
] as const;

const inputClass =
  "h-11 rounded-xl border-slate-200/90 bg-white shadow-sm transition focus-visible:border-violet-300 focus-visible:ring-violet-500/25";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (project: ProjetPonctuelListItem) => void;
};

const emptyForm = (): ProjetPonctuelInput => ({
  titre: "",
  description: "",
  dateDebut: new Date().toISOString().slice(0, 10),
  dateCloture: "",
  statutProjet: "EN_ATTENTE",
});

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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
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

export default function ProjetPonctuelFormDialog({ open, onOpenChange, onSuccess }: Props) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [form, setForm] = useState<ProjetPonctuelInput>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) setForm(emptyForm());
  }, [open]);

  const updateField = <K extends keyof ProjetPonctuelInput>(
    field: K,
    value: ProjetPonctuelInput[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!clerkLoaded) {
      toast.error("Chargement de la session, veuillez réessayer.");
      return;
    }
    if (!clerkUser?.id) {
      toast.error("Vous devez être connecté pour créer un projet.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createProjetPonctuel(
        {
          ...form,
          dateCloture: form.dateCloture?.trim() ? form.dateCloture : null,
        },
        clerkUser.id
      );

      if (result.success) {
        toast.success("Projet ponctuel créé avec succès.");
        onSuccess?.(result.project);
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Erreur lors de la création.");
      }
    } catch (error) {
      console.error("ProjetPonctuelFormDialog submit:", error);
      toast.error("Erreur lors de la création du projet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-h-[min(92dvh,820px)] w-[calc(100%-1rem)] max-w-xl flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl sm:w-full",
          "top-auto bottom-0 translate-y-0 sm:top-[50%] sm:bottom-auto sm:translate-y-[-50%]",
          "data-[state=open]:slide-in-from-bottom-4 sm:data-[state=open]:slide-in-from-bottom-0"
        )}
      >
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 px-5 pb-5 pt-6 sm:px-6 sm:pb-6">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.18),transparent_50%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-full bg-white/10 blur-2xl"
            aria-hidden
          />

          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm">
              <Wand2 className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1 pr-8">
              <DialogTitle className="text-left text-xl font-bold text-white sm:text-2xl">
                Créer un projet ponctuel
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-left text-sm text-white/85">
                Définissez les informations essentielles. Vous pourrez ensuite ajouter
                activités et responsables.
              </DialogDescription>
            </div>
          </div>

          <div className="relative mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white/90 ring-1 ring-white/20">
              <Sparkles className="h-3 w-3 text-amber-300" />
              Nouveau projet
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
                description="Titre et description du projet"
              >
                <div className="space-y-2">
                  <Label htmlFor="projet-titre" className="text-slate-700">
                    Titre <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="projet-titre"
                    className={inputClass}
                    value={form.titre}
                    onChange={(e) => updateField("titre", e.target.value)}
                    placeholder="Ex. Campagne de lancement produit"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projet-description" className="text-slate-700">
                    Description <span className="text-rose-500">*</span>
                  </Label>
                  <Textarea
                    id="projet-description"
                    className="min-h-[108px] resize-y rounded-xl border-slate-200/90 bg-white shadow-sm focus-visible:border-violet-300 focus-visible:ring-violet-500/25"
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Contexte, objectifs et périmètre du projet..."
                    required
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
                    <Label htmlFor="projet-date-debut" className="text-slate-700">
                      Date de début <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="projet-date-debut"
                      type="date"
                      className={inputClass}
                      value={form.dateDebut}
                      onChange={(e) => updateField("dateDebut", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="projet-date-cloture" className="text-slate-700">
                      Date de clôture
                      <span className="ml-1 text-xs font-normal text-slate-400">(optionnel)</span>
                    </Label>
                    <Input
                      id="projet-date-cloture"
                      type="date"
                      className={inputClass}
                      value={form.dateCloture ?? ""}
                      onChange={(e) => updateField("dateCloture", e.target.value)}
                      min={form.dateDebut || undefined}
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection
                icon={Tag}
                title="Statut initial"
                description="État du projet à la création"
              >
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {STATUT_OPTIONS.map((option) => {
                    const selected = (form.statutProjet ?? "EN_ATTENTE") === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          updateField(
                            "statutProjet",
                            option.value as ProjetPonctuelInput["statutProjet"]
                          )
                        }
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
                className="h-11 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/20 hover:from-violet-700 hover:to-fuchsia-700 sm:min-w-[9.5rem]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
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
