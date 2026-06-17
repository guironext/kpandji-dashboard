"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Calendar, CalendarPlus, Clock, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatEnumLabel, statutBadgeClass } from "@/lib/contentieux-display";
import {
  createGestionAudiences,
  getGestionAudiencesByDossier,
  type GestionAudienceItem,
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
import { Textarea } from "@/components/ui/textarea";

const STATUT_AUDIENCE = [
  "RECLAMATION",
  "MISE_EN_DEMEURE",
  "CONCILIATION",
  "MEDIATION",
  "ASSIGNATION",
  "AUDIENCE",
  "JUGEMENT",
  "APPEL",
  "EXECUTION",
  "EN_ATTENTE",
  "EN_TRAITEMENT",
  "EN_COURS",
  "TERMINEE",
  "ANNULE",
] as const;

const audienceSchema = z.object({
  dateAudience: z.string().min(1, "La date d'audience est requise"),
  heureAudience: z.string().min(1, "L'heure est requise"),
  rjAudience: z.string().min(1, "Le RJ est requis"),
  statutAudience: z.enum(STATUT_AUDIENCE),
  salleAudience: z.string().min(1, "La salle est requise"),
  tribunalAudience: z.string().min(1, "Le tribunal est requis"),
  resultatAudience: z.string().min(1, "Le résultat est requis"),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dossierId: string;
  numeroDossier: string;
  onAudienceAdded?: () => void;
};

const inputClass =
  "h-10 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-amber-500";

export default function GestionAudiencesDialog({
  open,
  onOpenChange,
  dossierId,
  numeroDossier,
  onAudienceAdded,
}: Props) {
  const [audiences, setAudiences] = useState<GestionAudienceItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof audienceSchema>>({
    resolver: zodResolver(audienceSchema),
    defaultValues: {
      dateAudience: new Date().toISOString().slice(0, 10),
      heureAudience: "",
      rjAudience: "",
      statutAudience: "AUDIENCE",
      salleAudience: "",
      tribunalAudience: "",
      resultatAudience: "",
    },
  });

  const loadAudiences = useCallback(async () => {
    setLoadingList(true);
    try {
      const result = await getGestionAudiencesByDossier(dossierId);
      if (result.success) {
        setAudiences(result.data);
      } else {
        toast.error(result.error ?? "Impossible de charger les audiences");
        setAudiences([]);
      }
    } catch {
      toast.error("Impossible de charger les audiences");
      setAudiences([]);
    } finally {
      setLoadingList(false);
    }
  }, [dossierId]);

  useEffect(() => {
    if (!open || !dossierId) return;
    form.reset({
      dateAudience: new Date().toISOString().slice(0, 10),
      heureAudience: "",
      rjAudience: "",
      statutAudience: "AUDIENCE",
      salleAudience: "",
      tribunalAudience: "",
      resultatAudience: "",
    });
    loadAudiences();
  }, [open, dossierId, loadAudiences, form]);

  const onSubmit = async (data: z.infer<typeof audienceSchema>) => {
    setSubmitting(true);
    try {
      const result = await createGestionAudiences({
        dossierContentieuxId: dossierId,
        dateAudience: new Date(data.dateAudience),
        heureAudience: data.heureAudience,
        rjAudience: data.rjAudience,
        statutAudience: data.statutAudience,
        salleAudience: data.salleAudience,
        tribunalAudience: data.tribunalAudience,
        resultatAudience: data.resultatAudience,
      });

      if (result.success && result.data) {
        toast.success("Audience enregistrée avec succès");
        setAudiences((prev) => [result.data!, ...prev]);
        form.reset({
          dateAudience: new Date().toISOString().slice(0, 10),
          heureAudience: "",
          rjAudience: "",
          statutAudience: "AUDIENCE",
          salleAudience: "",
          tribunalAudience: "",
          resultatAudience: "",
        });
        onAudienceAdded?.();
      } else {
        toast.error(result.error ?? "Erreur lors de l'enregistrement de l'audience");
      }
    } catch {
      toast.error("Erreur lors de l'enregistrement de l'audience");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-slate-100 bg-gradient-to-br from-amber-50 to-orange-50/80 px-6 py-5">
          <div className="flex items-start gap-3 pr-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0 text-left">
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Gestion des audiences
              </DialogTitle>
              <DialogDescription className="mt-1 text-slate-600">
                Dossier <span className="font-medium text-amber-700">{numeroDossier}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Audiences enregistrées ({audiences.length})
            </p>

            {loadingList ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              </div>
            ) : audiences.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
                <Calendar className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Aucune audience enregistrée
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Planifiez une première audience avec le formulaire ci-dessous.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {audiences.map((audience) => (
                  <li
                    key={audience.id}
                    className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100/80"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {format(new Date(audience.dateAudience), "dd MMM yyyy", {
                              locale: fr,
                            })}
                          </p>
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            {audience.heureAudience}
                          </span>
                        </div>
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {audience.rjAudience ?  ` · RJ ${audience.salleAudience}` : null}
                          {audience.salleAudience ? ` · Salle ${audience.salleAudience}` : null}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {audience.tribunalAudience}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          "shrink-0 border-0 text-[10px]",
                          statutBadgeClass(audience.statutAudience)
                        )}
                      >
                        {formatEnumLabel(audience.statutAudience)}
                      </Badge>
                    </div>
                    {audience.resultatAudience ? (
                      <p className="mt-2 line-clamp-2 text-xs text-slate-600">
                        {audience.resultatAudience}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <CalendarPlus className="h-3.5 w-3.5" />
              Nouvelle audience
            </p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="dateAudience"
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
                    name="heureAudience"
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
                    name="statutAudience"
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
                            {STATUT_AUDIENCE.map((v) => (
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
                    name="rjAudience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">RJ</FormLabel>
                        <FormControl>
                          <Input className={inputClass} placeholder="RJ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="salleAudience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Salle</FormLabel>
                        <FormControl>
                          <Input className={inputClass} placeholder="N° salle" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tribunalAudience"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-xs">Tribunal</FormLabel>
                        <FormControl>
                          <Input className={inputClass} placeholder="Tribunal compétent" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="resultatAudience"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-xs">Résultat</FormLabel>
                        <FormControl>
                          <Textarea
                            className="min-h-[72px] rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-amber-500"
                            rows={2}
                            placeholder="Résultat ou observations…"
                            {...field}
                          />
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
                    "h-10 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600",
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
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      Enregistrer l&apos;audience
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
