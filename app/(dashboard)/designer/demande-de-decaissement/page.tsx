"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { HandCoins, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20">
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500">
        <div className="absolute inset-0 bg-black/5" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-10">
          <div className="flex items-start gap-4">
            <div className="shrink-0 rounded-2xl border border-white/30 bg-white/20 p-3 shadow-xl backdrop-blur-md">
              <HandCoins className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">
                Demandes de décaissement
              </h1>
              <p className="mt-1.5 text-base text-amber-50/95">
                Créez une demande et suivez la validation du département
              </p>
            </div>
          </div>
          <Button
            size="lg"
            onClick={openCreate}
            className="w-full border-0 bg-white font-semibold text-amber-900 shadow-lg hover:bg-amber-50 sm:w-auto"
          >
            <Plus className="h-5 w-5" />
            Demande de Décaissement
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Demandes créées
              </h2>
              <p className="text-sm text-slate-500">
                Validation, décaissement et actions sur chaque demande
              </p>
            </div>
            {!loading && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
                {demandes.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-amber-800">
              <Loader2 className="h-5 w-5 animate-spin" />
              Chargement des demandes...
            </div>
          ) : demandes.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="font-medium text-slate-800">Aucune demande pour le moment</p>
              <p className="mt-1 text-sm text-slate-500">
                Utilisez le bouton Demande de Décaissement pour en créer une.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
                  <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Demandeur
                  </TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Service
                  </TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Département
                  </TableHead>
                  <TableHead className="h-12 min-w-48 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Raison
                  </TableHead>
                  <TableHead className="h-12 px-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Montant demandé
                  </TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Validation
                  </TableHead>
                  <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Décaissement effectués
                  </TableHead>
                  <TableHead className="h-12 px-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Montant décaissé
                  </TableHead>
                  <TableHead className="sticky right-0 z-10 h-12 bg-slate-50 px-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.15)]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demandes.map((demande) => (
                  <TableRow
                    key={demande.id}
                    className="group border-slate-100 hover:bg-amber-50/40"
                  >
                    <TableCell className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                      {format(new Date(demande.createdAt), "d MMM yyyy", {
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 font-medium text-slate-900">
                      {demande.demandeur}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-slate-600">
                      {demande.service || "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-slate-700">
                      {demande.departement}
                    </TableCell>
                    <TableCell className="max-w-xs px-4 py-3.5 whitespace-normal text-slate-700">
                      <span className="line-clamp-2" title={demande.raison}>
                        {demande.raison}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-right font-semibold tabular-nums text-slate-900">
                      {demande.montant}
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      {demande.validationDepartement ? (
                        <Badge className="border-transparent bg-emerald-100 text-emerald-800">
                          Validé
                        </Badge>
                      ) : (
                        <Badge className="border-transparent bg-amber-100 text-amber-800">
                          En attente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      {demande.decaissementEffectues ? (
                        <Badge className="border-transparent bg-emerald-100 text-emerald-800">
                          Oui
                        </Badge>
                      ) : (
                        <Badge className="border-transparent bg-slate-100 text-slate-600">
                          Non
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-right font-medium tabular-nums text-slate-800">
                      {demande.montantDecaisse || "—"}
                    </TableCell>
                    <TableCell className="sticky right-0 z-10 bg-white px-4 py-3.5 shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)] group-hover:bg-amber-50">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Modifier la demande"
                              onClick={() => openEdit(demande)}
                              className="text-slate-600 hover:bg-white hover:text-amber-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Modifier</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Supprimer la demande"
                              onClick={() => setPendingDelete(demande)}
                              className="text-slate-600 hover:bg-white hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Supprimer</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) closeForm();
        }}
      >
        <DialogContent className="z-[80] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Modifier la demande" : "Demande de Décaissement"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Mettez à jour le service, la raison et le montant."
                : "Renseignez la demande. Elle sera enregistrée en attente de validation du département."}
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
        <DialogContent className="z-[80] sm:max-w-md">
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
