"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createCongeAnnuel, updateCongeAnnuel } from "@/lib/actions/conge-annuel";
import { getAllEmployees } from "@/lib/actions/employee";
import { toast } from "sonner";
import { Loader2, Plus, CalendarDays, Pencil } from "lucide-react";

const congeSchema = z
  .object({
    employeeId: z.string().min(1, "Sélectionnez un employé"),
    datedebut: z.string().min(1, "La date de début est requise"),
    datefin: z.string().min(1, "La date de fin est requise"),
    status: z.enum(["EN_ATTENTE", "VALIDE", "EN_COURS", "TERMINEE", "ANNULE"]),
  })
  .refine(
    (data) => {
      const debut = new Date(data.datedebut);
      const fin = new Date(data.datefin);
      return fin >= debut;
    },
    { message: "La date de fin doit être après la date de début", path: ["datefin"] }
  );

type CongeFormData = z.infer<typeof congeSchema>;

interface EmployeeOption {
  id: string;
  nom: string;
  prenoms: string;
}

export type CongeItemForEdit = {
  id: string;
  employeeId: string;
  datedebut: string;
  datefin: string;
  status: string;
};

interface CongeAnnuelFormDialogProps {
  onSuccess?: () => void;
  triggerLabel?: string;
  /** When provided, dialog works in edit mode (controlled) */
  editingConge?: CongeItemForEdit | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Called when create trigger is clicked (e.g. to clear edit selection) */
  onOpenCreate?: () => void;
}

export function CongeAnnuelFormDialog({
  onSuccess,
  triggerLabel = "Créer Congé",
  editingConge,
  open: controlledOpen,
  onOpenChange,
  onOpenCreate,
}: CongeAnnuelFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  const isEditing = !!editingConge;
  const isOpen = isEditing ? (controlledOpen ?? false) : internalOpen;
  const setIsOpen = isEditing ? (onOpenChange ?? (() => {})) : setInternalOpen;

  useEffect(() => {
    async function loadEmployees() {
      const res = await getAllEmployees();
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : [];
        setEmployees(
          list
            .map((e) => {
              const o = e as Record<string, unknown>;
              return {
                id: String(o?.id ?? ""),
                nom: String(o?.nom ?? ""),
                prenoms: String(o?.prenoms ?? ""),
              };
            })
            .filter((e) => e.id)
        );
      }
    }
    if (isOpen) loadEmployees();
  }, [isOpen]);

  const form = useForm<CongeFormData>({
    resolver: zodResolver(congeSchema),
    defaultValues: {
      employeeId: "",
      datedebut: "",
      datefin: "",
      status: "EN_ATTENTE",
    },
  });

  useEffect(() => {
    if (editingConge) {
      form.reset({
        employeeId: editingConge.employeeId,
        datedebut: editingConge.datedebut.split("T")[0],
        datefin: editingConge.datefin.split("T")[0],
        status: editingConge.status as CongeFormData["status"],
      });
    } else {
      form.reset({
        employeeId: "",
        datedebut: "",
        datefin: "",
        status: "EN_ATTENTE",
      });
    }
  }, [editingConge, form]);

  const onSubmit = async (data: CongeFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing && editingConge) {
        const result = await updateCongeAnnuel(editingConge.id, {
          employeeId: data.employeeId,
          datedebut: new Date(data.datedebut).toISOString(),
          datefin: new Date(data.datefin).toISOString(),
          status: data.status,
        });
        if (result.success) {
          toast.success("Congé modifié avec succès !");
          setIsOpen(false);
          onSuccess?.();
        } else {
          toast.error(result.error || "Erreur lors de la modification du congé");
        }
      } else {
        const result = await createCongeAnnuel({
          employeeId: data.employeeId,
          datedebut: new Date(data.datedebut).toISOString(),
          datefin: new Date(data.datefin).toISOString(),
          status: data.status,
        });
        if (result.success) {
          toast.success("Congé créé avec succès !");
          form.reset({
            employeeId: "",
            datedebut: "",
            datefin: "",
            status: "EN_ATTENTE",
          });
          setIsOpen(false);
          onSuccess?.();
        } else {
          toast.error(result.error || "Erreur lors de la création du congé");
        }
      }
    } catch (error) {
      console.error(isEditing ? "Error updating conge:" : "Error creating conge:", error);
      toast.error(isEditing ? "Erreur lors de la modification du congé" : "Erreur lors de la création du congé");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerClick = () => {
    onOpenCreate?.();
    setInternalOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={handleTriggerClick}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
        >
          <Plus className="h-5 w-5" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <div className="flex items-center gap-3 pb-2">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isEditing ? "bg-amber-100 dark:bg-amber-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`}>
            {isEditing ? (
              <Pencil className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            ) : (
              <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div>
            <DialogTitle className="text-lg font-semibold">
              {isEditing ? "Modifier le congé" : "Créer un congé annuel"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {isEditing ? "Modifiez les informations du congé" : "Remplissez le formulaire pour planifier un congé"}
            </DialogDescription>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employé *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un employé" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.nom} {emp.prenoms}
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
              name="datedebut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de début *</FormLabel>
                  <FormControl>
                    <Input type="date" className="h-10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="datefin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de fin *</FormLabel>
                  <FormControl>
                    <Input type="date" className="h-10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                      <SelectItem value="VALIDE">Validé</SelectItem>
                      <SelectItem value="EN_COURS">En cours</SelectItem>
                      <SelectItem value="TERMINEE">Terminée</SelectItem>
                      <SelectItem value="ANNULE">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : isEditing ? (
                  "Enregistrer les modifications"
                ) : (
                  "Créer le congé"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
