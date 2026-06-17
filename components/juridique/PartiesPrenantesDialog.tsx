"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Loader2, Mail, Phone, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatEnumLabel } from "@/lib/contentieux-display";
import {
  createPartiesPrenantes,
  getPartiesPrenantesByDossier,
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

const TYPE_PARTIE = [
  "PERSONNE_PHYSIQUE",
  "PERSONNE_MORALE",
  "ENTREPRISE",
  "ORGANISATION",
  "ADMINISTRATION",
  "AUTRE",
] as const;

const partieSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  telephone: z.string().optional(),
  typePartie: z.enum(TYPE_PARTIE),
});

export type PartiePrenanteItem = {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  typePartie: string;
  createdAt: Date;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dossierId: string;
  numeroDossier: string;
  onPartieAdded?: () => void;
};

const inputClass =
  "h-10 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-violet-500";

export default function PartiesPrenantesDialog({
  open,
  onOpenChange,
  dossierId,
  numeroDossier,
  onPartieAdded,
}: Props) {
  const [parties, setParties] = useState<PartiePrenanteItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof partieSchema>>({
    resolver: zodResolver(partieSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      typePartie: "PERSONNE_PHYSIQUE",
    },
  });

  const loadParties = useCallback(async () => {
    setLoadingList(true);
    try {
      const result = await getPartiesPrenantesByDossier(dossierId);
      if (result.success) {
        setParties(result.data);
      } else {
        toast.error(result.error ?? "Impossible de charger les parties");
        setParties([]);
      }
    } catch {
      toast.error("Impossible de charger les parties");
      setParties([]);
    } finally {
      setLoadingList(false);
    }
  }, [dossierId]);

  useEffect(() => {
    if (!open || !dossierId) return;
    form.reset({
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      typePartie: "PERSONNE_PHYSIQUE",
    });
    loadParties();
  }, [open, dossierId, loadParties]);

  const onSubmit = async (data: z.infer<typeof partieSchema>) => {
    setSubmitting(true);
    try {
      const result = await createPartiesPrenantes({
        dossierContentieuxId: dossierId,
        nom: data.nom,
        prenom: data.prenom,
        email: data.email || undefined,
        telephone: data.telephone || undefined,
        typePartie: data.typePartie,
      });

      if (result.success && result.data) {
        toast.success("Partie prenante ajoutée avec succès");
        setParties((prev) => [
          {
            id: result.data!.id,
            nom: result.data!.nom,
            prenom: result.data!.prenom,
            email: result.data!.email,
            telephone: result.data!.telephone,
            typePartie: result.data!.typePartie,
            createdAt: result.data!.createdAt,
          },
          ...prev,
        ]);
        form.reset({
          nom: "",
          prenom: "",
          email: "",
          telephone: "",
          typePartie: "PERSONNE_PHYSIQUE",
        });
        onPartieAdded?.();
      } else {
        toast.error(result.error ?? "Erreur lors de l'ajout de la partie");
      }
    } catch {
      toast.error("Erreur lors de l'ajout de la partie");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-slate-100 bg-gradient-to-br from-violet-50 to-indigo-50/80 px-6 py-5">
          <div className="flex items-start gap-3 pr-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0 text-left">
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Parties prenantes
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
              Parties enregistrées ({parties.length})
            </p>

            {loadingList ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
              </div>
            ) : parties.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
                <Users className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Aucune partie enregistrée
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Ajoutez une première partie avec le formulaire ci-dessous.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {parties.map((partie) => (
                  <li
                    key={partie.id}
                    className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100/80"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          {partie.prenom} {partie.nom}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          Ajouté le{" "}
                          {format(new Date(partie.createdAt), "dd MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="shrink-0 border-0 bg-violet-100 text-[10px] text-violet-800"
                      >
                        {formatEnumLabel(partie.typePartie)}
                      </Badge>
                    </div>
                    {(partie.email || partie.telephone) && (
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                        {partie.email ? (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {partie.email}
                          </span>
                        ) : null}
                        {partie.telephone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {partie.telephone}
                          </span>
                        ) : null}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <UserPlus className="h-3.5 w-3.5" />
              Nouvelle partie
            </p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Nom</FormLabel>
                        <FormControl>
                          <Input className={inputClass} placeholder="Nom" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="prenom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Prénom</FormLabel>
                        <FormControl>
                          <Input className={inputClass} placeholder="Prénom" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="typePartie"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-xs">Type de partie</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className={inputClass}>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TYPE_PARTIE.map((v) => (
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Email (optionnel)</FormLabel>
                        <FormControl>
                          <Input
                            className={inputClass}
                            type="email"
                            placeholder="email@exemple.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telephone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Téléphone (optionnel)</FormLabel>
                        <FormControl>
                          <Input className={inputClass} placeholder="+225 …" {...field} />
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
                    "h-10 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600",
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
                      <UserPlus className="mr-2 h-4 w-4" />
                      Ajouter la partie
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
