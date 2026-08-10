"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ClipboardList, FileText, Loader2, Plus, Sparkles, Users } from "lucide-react";
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
  createProjetPonctuelActivite,
  type ProjetPonctuelActiviteInput,
  type ProjetPonctuelActiviteItem,
} from "@/lib/actions/projet-ponctuel-activite";
import type { UserForActorOption } from "@/lib/actions/communication-actor";
import ResponsableUserPicker from "./ResponsableUserPicker";
import {
  defaultActiviteStartDate,
  formatProjetPeriod,
  toInputDate,
  validateActiviteDatesInProjetRange,
  type ProjetDateBounds,
} from "@/lib/projet-ponctuel-dates";

const inputClass =
  "h-11 rounded-xl border-slate-200/90 bg-white shadow-sm transition focus-visible:border-sky-300 focus-visible:ring-sky-500/25";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projetPonctuelId: string;
  projetBounds: ProjetDateBounds;
  users: UserForActorOption[];
  isLoadingUsers: boolean;
  onSuccess?: (activite: ProjetPonctuelActiviteItem) => void;
};

const emptyForm = (bounds: ProjetDateBounds): Omit<ProjetPonctuelActiviteInput, "projetPonctuelId"> => ({
  titre: "",
  description: "",
  dateDebut: defaultActiviteStartDate(bounds),
  dateCloture: "",
  responsableUserIds: [],
});

function FormSection({
  icon: Icon,
  title,
  description,
  children,
  iconClass,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
  children: React.ReactNode;
  iconClass: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-100/80 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
            iconClass
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function ActiviteFormDialog({
  open,
  onOpenChange,
  projetPonctuelId,
  projetBounds,
  users,
  isLoadingUsers,
  onSuccess,
}: Props) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [form, setForm] = useState(emptyForm(projetBounds));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const projetDateDebut = projetBounds.dateDebut;
  const projetDateCloture = projetBounds.dateCloture;

  const projetMinDate = toInputDate(projetDateDebut);
  const projetMaxDate = projetDateCloture ? toInputDate(projetDateCloture) : undefined;
  const clotureMinDate = form.dateDebut > projetMinDate ? form.dateDebut : projetMinDate;

  useEffect(() => {
    if (open) {
      setForm(emptyForm({ dateDebut: projetDateDebut, dateCloture: projetDateCloture }));
      setUserSearch("");
    }
  }, [open, projetDateDebut, projetDateCloture]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!clerkLoaded) {
      toast.error("Chargement de la session, veuillez réessayer.");
      return;
    }
    if (!clerkUser?.id) {
      toast.error("Vous devez être connecté.");
      return;
    }

    const rangeError = validateActiviteDatesInProjetRange(
      form.dateDebut,
      form.dateCloture?.trim() ? form.dateCloture : null,
      projetBounds
    );
    if (rangeError) {
      toast.error(rangeError);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createProjetPonctuelActivite(
        {
          projetPonctuelId,
          ...form,
          dateCloture: form.dateCloture?.trim() ? form.dateCloture : null,
        },
        clerkUser.id
      );

      if (result.success) {
        toast.success("Activité créée avec succès.");
        onSuccess?.(result.activite);
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Erreur lors de la création.");
      }
    } catch (error) {
      console.error("ActiviteFormDialog submit:", error);
      toast.error("Erreur lors de la création de l'activité.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-h-[min(92dvh,860px)] w-[calc(100%-1rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl sm:w-full",
          "top-auto bottom-0 translate-y-0 sm:top-[50%] sm:bottom-auto sm:translate-y-[-50%]",
          "data-[state=open]:slide-in-from-bottom-4 sm:data-[state=open]:slide-in-from-bottom-0"
        )}
      >
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-sky-600 via-cyan-600 to-teal-600 px-5 pb-5 pt-6 sm:px-6">
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
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1 pr-8">
              <DialogTitle className="text-left text-xl font-bold text-white sm:text-2xl">
                Nouvelle activité
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-left text-sm text-white/85">
                Définissez l&apos;activité et assignez les responsables en une seule étape.
              </DialogDescription>
            </div>
          </div>

          <div className="relative mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white/90 ring-1 ring-white/20">
              <Sparkles className="h-3 w-3 text-amber-300" />
              ProjetPonctuelActivite
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
                description="Titre, description et calendrier de l'activité"
                iconClass="bg-sky-50 text-sky-600 ring-sky-100"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="activite-titre" className="text-slate-700">
                      Titre <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="activite-titre"
                      className={inputClass}
                      value={form.titre}
                      onChange={(e) => setForm((p) => ({ ...p, titre: e.target.value }))}
                      placeholder="Ex. Préparation du support visuel"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activite-description" className="text-slate-700">
                      Description <span className="text-rose-500">*</span>
                    </Label>
                    <Textarea
                      id="activite-description"
                      className="min-h-[100px] resize-y rounded-xl border-slate-200/90 bg-white shadow-sm focus-visible:border-sky-300 focus-visible:ring-sky-500/25"
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Contexte, livrables et objectifs de l'activité..."
                      required
                    />
                  </div>

                  <div className="rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2.5 text-xs text-sky-800">
                    Les dates de l&apos;activité doivent rester dans la période du projet{" "}
                    <span className="font-semibold">({formatProjetPeriod(projetBounds)})</span>.
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="activite-debut" className="text-slate-700">
                        Date de début <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="activite-debut"
                        type="date"
                        className={inputClass}
                        value={form.dateDebut}
                        onChange={(e) => setForm((p) => ({ ...p, dateDebut: e.target.value }))}
                        min={projetMinDate}
                        max={projetMaxDate}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="activite-cloture" className="text-slate-700">
                        Date de clôture
                        <span className="ml-1 text-xs font-normal text-slate-400">(optionnel)</span>
                      </Label>
                      <Input
                        id="activite-cloture"
                        type="date"
                        className={inputClass}
                        value={form.dateCloture ?? ""}
                        onChange={(e) => setForm((p) => ({ ...p, dateCloture: e.target.value }))}
                        min={clotureMinDate}
                        max={projetMaxDate}
                      />
                    </div>
                  </div>
                </div>
              </FormSection>

              <FormSection
                icon={Users}
                title="Responsables"
                description="Utilisateurs en charge de cette activité"
                iconClass="bg-teal-50 text-teal-600 ring-teal-100"
              >
                <ResponsableUserPicker
                  users={users}
                  selectedIds={form.responsableUserIds ?? []}
                  onChange={(ids) => setForm((p) => ({ ...p, responsableUserIds: ids }))}
                  search={userSearch}
                  onSearchChange={setUserSearch}
                  isLoading={isLoadingUsers}
                  maxHeightClass="max-h-52"
                />
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
                className="h-11 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 shadow-lg shadow-sky-500/20 hover:from-sky-700 hover:to-teal-700 sm:min-w-[10rem]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer l&apos;activité
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
