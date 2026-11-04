"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Building2, CalendarDays, HandCoins, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  createDecaissement,
  deleteDecaissement,
  getCurrentDecaissementIdentity,
  getDecaissements,
  updateDecaissement,
  type DecaissementItem,
} from "@/lib/actions/decaissement";

const decaissementSchema = z.object({
  demandeur: z.string().trim().min(1, "Le demandeur est requis"),
  service: z.string().trim().optional(),
  departement: z.string().trim().min(1, "Le département est requis"),
  raison: z.string().trim().min(1, "La raison est requise"),
  montant: z.string().trim().min(1, "Le montant est requis"),
});

type DecaissementFormData = z.infer<typeof decaissementSchema>;

const emptyValues: DecaissementFormData = {
  demandeur: "",
  service: "",
  departement: "",
  raison: "",
  montant: "",
};

function StatusPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "wait" | "ok" | "muted";
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <span
        className={cn(
          "mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
          tone === "ok" && "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
          tone === "wait" && "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
          tone === "muted" && "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
        )}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            tone === "ok" && "bg-emerald-500",
            tone === "wait" && "bg-amber-500",
            tone === "muted" && "bg-slate-400",
          )}
        />
        {value}
      </span>
    </div>
  );
}

export default function DemandeDeDecaissementPage() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [demandes, setDemandes] = useState<DecaissementItem[]>([]);
  const [identity, setIdentity] = useState({ demandeur: "", departement: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DecaissementItem | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const form = useForm<DecaissementFormData>({
    resolver: zodResolver(decaissementSchema),
    defaultValues: emptyValues,
  });

  const blankForm = useCallback(
    (): DecaissementFormData => ({
      ...emptyValues,
      demandeur: identity.demandeur,
      departement: identity.departement,
    }),
    [identity]
  );

  const loadDemandes = useCallback(async () => {
    const result = await getDecaissements();
    if (result.success) {
      setDemandes(result.data);
    } else {
      toast.error(result.error || "Erreur lors du chargement des demandes");
    }
  }, []);

  useEffect(() => {
    loadDemandes().finally(() => setLoading(false));
  }, [loadDemandes]);

  useEffect(() => {
    getCurrentDecaissementIdentity().then((result) => {
      if (!result.success) return;
      setIdentity({
        demandeur: result.demandeur,
        departement: result.departement,
      });
      form.setValue("demandeur", result.demandeur);
      form.setValue("departement", result.departement);
    });
  }, [form]);

  const closeForm = () => {
    setOpen(false);
    setEditingId(null);
    form.reset(blankForm());
  };

  const openCreate = () => {
    setEditingId(null);
    form.reset(blankForm());
    setOpen(true);
  };

  const openEdit = (demande: DecaissementItem) => {
    setEditingId(demande.id);
    form.reset({
      demandeur: demande.demandeur,
      service: demande.service ?? "",
      departement: demande.departement,
      raison: demande.raison,
      montant: demande.montant,
    });
    setOpen(true);
  };

  const onSubmit = async (data: DecaissementFormData) => {
    setSubmitting(true);
    try {
      if (editingId) {
        const result = await updateDecaissement(editingId, {
          service: data.service,
          raison: data.raison,
          montant: data.montant,
        });

        if (!result.success || !result.data) {
          toast.error(result.error || "Impossible de modifier la demande");
          return;
        }

        setDemandes((current) =>
          current.map((item) =>
            item.id === result.data!.id ? result.data! : item
          )
        );
        closeForm();
        toast.success("Demande modifiée");
        return;
      }

      const result = await createDecaissement({
        demandeur: data.demandeur,
        service: data.service,
        departement: data.departement,
        raison: data.raison,
        montant: data.montant,
      });

      if (!result.success || !result.data) {
        toast.error(result.error || "Impossible d'enregistrer la demande");
        return;
      }

      setDemandes((current) => [result.data!, ...current]);
      closeForm();
      toast.success("Demande de décaissement enregistrée");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const result = await deleteDecaissement(pendingDelete.id);
      if (!result.success) {
        toast.error(result.error || "Impossible de supprimer la demande");
        return;
      }
      setDemandes((current) =>
        current.filter((item) => item.id !== pendingDelete.id)
      );
      if (editingId === pendingDelete.id) closeForm();
      setPendingDelete(null);
      toast.success("Demande supprimée");
    } finally {
      setDeleting(false);
    }
  };

  const enAttente = demandes.filter((item) => !item.validationDepartement).length;
  const validees = demandes.length - enAttente;

  return (
    <div className="min-h-screen bg-[#f6f3ee]">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-amber-300">
              <HandCoins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Commercial</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Demandes de décaissement
              </h1>
              <p className="mt-1 max-w-xl text-sm text-slate-500">
                Chaque demande part avec une validation responsable en attente.
              </p>
            </div>
          </div>
          <Button
            size="lg"
            onClick={openCreate}
            className="h-11 w-full bg-slate-950 text-amber-200 hover:bg-slate-800 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Nouvelle demande
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {!loading && demandes.length > 0 && (
          <div className="mb-5 grid grid-cols-3 gap-2 sm:max-w-md">
            <div className="rounded-2xl bg-white px-3 py-3 shadow-sm ring-1 ring-slate-200">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Total</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">{demandes.length}</p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-3 shadow-sm ring-1 ring-amber-200">
              <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700">En attente</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">{enAttente}</p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-3 shadow-sm ring-1 ring-emerald-200">
              <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">Validées</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">{validees}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-white py-20 text-slate-600 shadow-sm ring-1 ring-slate-200">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement des demandes...
          </div>
        ) : demandes.length === 0 ? (
          <div className="rounded-2xl bg-white px-5 py-16 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-amber-300">
              <HandCoins className="h-5 w-5" />
            </div>
            <p className="mt-4 font-medium text-slate-900">Aucune demande pour le moment</p>
            <p className="mt-1 text-sm text-slate-500">
              Créez la première demande de décaissement.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {demandes.map((demande) => (
              <article
                key={demande.id}
                className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
              >
                <div className={cn("h-1", demande.validationDepartement ? "bg-emerald-500" : "bg-amber-400")} />
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-xs text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {format(new Date(demande.createdAt), "d MMM yyyy", { locale: fr })}
                      </p>
                      <h2 className="mt-1 truncate text-base font-semibold text-slate-950">{demande.demandeur}</h2>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {demande.departement}
                          {demande.service ? ` · ${demande.service}` : ""}
                        </span>
                      </p>
                    </div>
                    <p className="shrink-0 rounded-xl bg-slate-950 px-3 py-2 text-right text-sm font-semibold text-amber-200">
                      {demande.montant}
                    </p>
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-700">{demande.raison}</p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <StatusPill
                      label="Validation responsable"
                      value={demande.validationDepartement ? "Validé" : "En attente"}
                      tone={demande.validationDepartement ? "ok" : "wait"}
                    />
                    <StatusPill
                      label="Décaissement"
                      value={demande.decaissementEffectues ? "Effectué" : "Non effectué"}
                      tone={demande.decaissementEffectues ? "ok" : "muted"}
                    />
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Montant décaissé</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">{demande.montantDecaisse || "—"}</p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openEdit(demande)}
                      className="h-10 flex-1 border-slate-200 text-slate-800"
                    >
                      <Pencil className="h-4 w-4" />
                      Modifier
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Supprimer la demande"
                      onClick={() => setPendingDelete(demande)}
                      className="h-10 w-10 shrink-0 border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) closeForm();
        }}
      >
        <DialogContent className="z-[80] max-h-[min(90dvh,90vh)] w-[calc(100%-1rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Modifier la demande" : "Demande de Décaissement"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Mettez à jour le service, la raison et le montant."
                : "Renseignez la demande. La validation responsable sera enregistrée en attente."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="demandeur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom demandeur</FormLabel>
                    <FormControl>
                      <Input
                        readOnly
                        placeholder="Nom du demandeur"
                        className="bg-slate-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="service"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <FormControl>
                      <Input placeholder="Service (optionnel)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="departement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Département</FormLabel>
                    <FormControl>
                      <Input
                        readOnly
                        placeholder="Rôle de l'utilisateur"
                        className="bg-slate-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="raison"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Raison</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Motif de la demande"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="montant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex. 150 000 FCFA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForm}
                  disabled={submitting}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {editingId ? "Enregistrer les modifications" : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next && !deleting) setPendingDelete(null);
        }}
      >
        <DialogContent className="z-[80] w-[calc(100%-1rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer cette demande ?</DialogTitle>
            <DialogDescription>
              La demande de {pendingDelete?.demandeur || "cet utilisateur"}{" "}
              pour {pendingDelete?.montant || "ce montant"} sera définitivement
              supprimée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingDelete(null)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
