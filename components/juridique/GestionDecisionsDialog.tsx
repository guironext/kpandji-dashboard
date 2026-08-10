"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Clock, Loader2, MapPin, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatEnumLabel, statutBadgeClass } from "@/lib/contentieux-display";
import {
  createGestionDesDecisionsDeJustice,
  getGestionDesDecisionsDeJusticeByDossier,
} from "@/lib/actions/contentieux";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUT_DECISION = [
  "EN_ATTENTE",
  "PARTIELLEMENT_EXECUTE",
  "EXECUTE",
  "NON_EXECUTE",
  "CONTESTEE",
  "EN_APPEL",
  "JUGEMENT",
  "ARRET",
  "ORDONNANCE",
  "APPEL",
  "EXECUTION",
  "EN_TRAITEMENT",
  "EN_COURS",
  "TERMINEE",
  "ANNULE",
] as const;

const decisionSchema = z.object({
  dateDecision: z.string().min(1, "La date de décision est requise"),
  heureDecision: z.string().min(1, "L'heure est requise"),
  lieuDecision: z.string().min(1, "Le lieu est requis"),
  statutDecision: z.enum(STATUT_DECISION),
});

export type GestionDecisionItem = {
  id: string;
  dateDecision: Date;
  heureDecision: string;
  lieuDecision: string;
  statutDecision: string;
  createdAt: Date;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dossierId: string;
  numeroDossier: string;
  onDecisionAdded?: () => void;
};

const inputClass =
  "h-10 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-violet-500";

export default function GestionDecisionsDialog({
  open,
  onOpenChange,
  dossierId,
  numeroDossier,
  onDecisionAdded,
}: Props) {
  const [decisions, setDecisions] = useState<GestionDecisionItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof decisionSchema>>({
    resolver: zodResolver(decisionSchema),
    defaultValues: {
      dateDecision: new Date().toISOString().slice(0, 10),
      heureDecision: "",
      lieuDecision: "",
      statutDecision: "EN_ATTENTE",
    },
  });

  const loadDecisions = useCallback(async () => {
    setLoadingList(true);
    try {
      const result = await getGestionDesDecisionsDeJusticeByDossier(dossierId);
      if (result.success) {
        setDecisions(result.data);
      } else {
        toast.error(result.error ?? "Impossible de charger les décisions");
        setDecisions([]);
      }
    } catch {
      toast.error("Impossible de charger les décisions");
      setDecisions([]);
    } finally {
      setLoadingList(false);
    }
  }, [dossierId]);

  useEffect(() => {
    if (!open || !dossierId) return;
    form.reset({
      dateDecision: new Date().toISOString().slice(0, 10),
      heureDecision: "",
      lieuDecision: "",
      statutDecision: "EN_ATTENTE",
    });
    loadDecisions();
  }, [open, dossierId, loadDecisions, form]);

  const onSubmit = async (data: z.infer<typeof decisionSchema>) => {
    setSubmitting(true);
    try {
      const result = await createGestionDesDecisionsDeJustice({
        dossierContentieuxId: dossierId,
        dateDecision: new Date(data.dateDecision),
        heureDecision: data.heureDecision,
        lieuDecision: data.lieuDecision,
        statutDecision: data.statutDecision,
      });

      if (result.success && result.data) {
        toast.success("Décision enregistrée avec succès");
        setDecisions((prev) => [
          {
            id: result.data!.id,
            dateDecision: result.data!.dateDecision,
            heureDecision: result.data!.heureDecision,
            lieuDecision: result.data!.lieuDecision,
            statutDecision: result.data!.statutDecision,
            createdAt: result.data!.createdAt,
          },
          ...prev,
        ]);
        form.reset({
          dateDecision: new Date().toISOString().slice(0, 10),
          heureDecision: "",
          lieuDecision: "",
          statutDecision: "EN_ATTENTE",
        });
        onDecisionAdded?.();
      } else {
        toast.error(result.error ?? "Erreur lors de l'enregistrement de la décision");
      }
    } catch {
      toast.error("Erreur lors de l'enregistrement de la décision");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-slate-100 bg-gradient-to-br from-violet-50 to-purple-50/80 px-6 py-5">
          <div className="flex items-start gap-3 pr-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
              <Scale className="h-5 w-5" />
            </div>
            <div className="min-w-0 text-left">
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Décisions de justice
              </DialogTitle>
              <DialogDescription className="mt-1 text-slate-600">
                Dossier <span className="font-medium text-violet-700">{numeroDossier}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Décisions enregistrées ({decisions.length})
            </p>

            {loadingList ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
              </div>
            ) : decisions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
                <Scale className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Aucune décision enregistrée
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Enregistrez une première décision avec le formulaire ci-dessous.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {decisions.map((decision) => (
                  <li
                    key={decision.id}
                    className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100/80"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {format(new Date(decision.dateDecision), "dd MMM yyyy", {
                              locale: fr,
                            })}
                          </p>
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            {decision.heureDecision}
                          </span>
                        </div>
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {decision.lieuDecision}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          "shrink-0 border-0 text-[10px]",
                          statutBadgeClass(decision.statutDecision)
                        )}
                      >
                        {formatEnumLabel(decision.statutDecision)}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Scale className="h-3.5 w-3.5" />
              Nouvelle décision
            </p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="dateDecision"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Date</FormLabel>
                        <FormControl>
                          <Input className={inputClass} type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="heureDecision"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Heure</FormLabel>
                        <FormControl>
                          <Input className={inputClass} type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="statutDecision"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-xs">Statut</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className={inputClass}>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STATUT_DECISION.map((v) => (
                              <SelectItem key={v} value={v}>
                                {formatEnumLabel(v)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lieuDecision"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-xs">Lieu</FormLabel>
                        <FormControl>
                          <Input className={inputClass} placeholder="Lieu de la décision" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className={cn(
                    "h-10 w-full rounded-xl bg-gradient-to-r from-violet-500 to-purple-600",
                    "text-white shadow-md hover:opacity-95"
                  )}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement…
                    </>
                  ) : (
                    <>
                      <Scale className="mr-2 h-4 w-4" />
                      Enregistrer la décision
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
