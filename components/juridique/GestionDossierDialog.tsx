"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FolderOpen, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatEnumLabel,
  STATUT_DOSSIER_OPTIONS,
  TYPE_DOSSIER_OPTIONS,
} from "@/lib/contentieux-display";
import {
  getDossierContentieuxById,
  updateDossierContentieux,
} from "@/lib/actions/contentieux";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CLOS_STATUTS = ["TERMINEE", "ANNULE"] as const;

const dossierSchema = z.object({
  typeDossier: z.enum(TYPE_DOSSIER_OPTIONS),
  statutDossier: z.enum(STATUT_DOSSIER_OPTIONS),
  objet: z.string().min(1, "L'objet est requis"),
  description: z.string().min(1, "La description est requise"),
  dateOuverture: z.string().min(1, "La date d'ouverture est requise"),
  dateCloture: z.string().optional(),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dossierId: string;
  numeroDossier: string;
  onDossierUpdated?: () => void;
};

const inputClass =
  "h-10 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-violet-500";

export default function GestionDossierDialog({
  open,
  onOpenChange,
  dossierId,
  numeroDossier,
  onDossierUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadedNumero, setLoadedNumero] = useState(numeroDossier);

  const form = useForm<z.infer<typeof dossierSchema>>({
    resolver: zodResolver(dossierSchema),
    defaultValues: {
      typeDossier: "CIVIL",
      statutDossier: "EN_ATTENTE",
      objet: "",
      description: "",
      dateOuverture: new Date().toISOString().slice(0, 10),
      dateCloture: "",
    },
  });

  const statutDossier = form.watch("statutDossier");
  const showDateCloture = CLOS_STATUTS.includes(
    statutDossier as (typeof CLOS_STATUTS)[number]
  );

  const loadDossier = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getDossierContentieuxById(dossierId);
      if (result.success && result.data) {
        const dossier = result.data;
        setLoadedNumero(dossier.numeroDossier);
        form.reset({
          typeDossier: dossier.typeDossier as z.infer<typeof dossierSchema>["typeDossier"],
          statutDossier:
            dossier.statutDossier as z.infer<typeof dossierSchema>["statutDossier"],
          objet: dossier.objet,
          description: dossier.description,
          dateOuverture: new Date(dossier.dateOuverture).toISOString().slice(0, 10),
          dateCloture: dossier.dateCloture
            ? new Date(dossier.dateCloture).toISOString().slice(0, 10)
            : "",
        });
      } else {
        toast.error(result.error ?? "Impossible de charger le dossier");
      }
    } catch {
      toast.error("Impossible de charger le dossier");
    } finally {
      setLoading(false);
    }
  }, [dossierId, form]);

  useEffect(() => {
    if (!open || !dossierId) return;
    loadDossier();
  }, [open, dossierId, loadDossier]);

  const onSubmit = async (data: z.infer<typeof dossierSchema>) => {
    setSubmitting(true);
    try {
      const isClosed = CLOS_STATUTS.includes(
        data.statutDossier as (typeof CLOS_STATUTS)[number]
      );

      const result = await updateDossierContentieux({
        id: dossierId,
        typeDossier: data.typeDossier,
        statutDossier: data.statutDossier,
        objet: data.objet,
        description: data.description,
        dateOuverture: new Date(data.dateOuverture),
        dateCloture:
          isClosed && data.dateCloture ? new Date(data.dateCloture) : isClosed ? new Date() : null,
      });

      if (result.success) {
        toast.success("Dossier mis à jour avec succès");
        onDossierUpdated?.();
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Erreur lors de la mise à jour du dossier");
      }
    } catch {
      toast.error("Erreur lors de la mise à jour du dossier");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-slate-100 bg-gradient-to-br from-indigo-50 to-violet-50/80 px-6 py-5">
          <div className="flex items-start gap-3 pr-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0 text-left">
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Gérer le dossier
              </DialogTitle>
              <DialogDescription className="mt-1 text-slate-600">
                Dossier{" "}
                <span className="font-medium text-violet-700">
                  {loadedNumero || numeroDossier}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
          ) : (
            <Form {...form}>
              <form
                id="form-gestion-dossier"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="typeDossier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de dossier</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className={inputClass}>
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TYPE_DOSSIER_OPTIONS.map((value) => (
                            <SelectItem key={value} value={value}>
                              {formatEnumLabel(value)}
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
                  name="objet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objet</FormLabel>
                      <FormControl>
                        <Input className={inputClass} placeholder="Objet du litige" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="statutDossier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut du dossier</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className={inputClass}>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUT_DOSSIER_OPTIONS.map((value) => (
                            <SelectItem key={value} value={value}>
                              {formatEnumLabel(value)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="dateOuverture"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date d&apos;ouverture</FormLabel>
                        <FormControl>
                          <Input className={inputClass} type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {showDateCloture ? (
                    <FormField
                      control={form.control}
                      name="dateCloture"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de clôture</FormLabel>
                          <FormControl>
                            <Input className={inputClass} type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : null}
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-[100px] rounded-xl border-slate-200 bg-white"
                          placeholder="Description détaillée du dossier"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          )}
        </div>

        <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <Button
            type="submit"
            form="form-gestion-dossier"
            disabled={loading || submitting}
            className={cn(
              "h-11 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md sm:w-auto",
              "hover:opacity-95 disabled:opacity-60"
            )}
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Enregistrer les modifications
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
