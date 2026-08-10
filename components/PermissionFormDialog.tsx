"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { createPermission, updatePermission } from "@/lib/actions/permission";
import { getAllEmployees } from "@/lib/actions/employee";
import { toast } from "sonner";
import { Loader2, Plus, CalendarClock, Pencil } from "lucide-react";

const permissionSchema = z
  .object({
    employeeId: z.string().min(1, "Sélectionnez un employé"),
    datedebut: z.string().min(1, "La date de début est requise"),
    datefin: z.string().min(1, "La date de fin est requise"),
    titre: z.enum(["EN_ATTENTE", "VALIDE", "EN_COURS", "TERMINEE", "ANNULE"]),
    description: z.string().min(1, "La description est requise"),
  })
  .refine(
    (data) => {
      const debut = new Date(data.datedebut);
      const fin = new Date(data.datefin);
      return fin >= debut;
    },
    { message: "La date de fin doit être après la date de début", path: ["datefin"] }
  );

type PermissionFormData = z.infer<typeof permissionSchema>;

interface EmployeeOption {
  id: string;
  nom: string;
  prenoms: string;
}

export type PermissionItemForEdit = {
  id: string;
  employeeId: string;
  datedebut: string;
  datefin: string;
  titre: string;
  description: string;
};

interface PermissionFormDialogProps {
  onSuccess?: () => void;
  triggerLabel?: string;
  /** When provided, dialog works in edit mode (controlled) */
  editingPermission?: PermissionItemForEdit | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Called when create trigger is clicked (e.g. to clear edit selection) */
  onOpenCreate?: () => void;
}

export function PermissionFormDialog({
  onSuccess,
  triggerLabel = "Créer Permission",
  editingPermission,
  open: controlledOpen,
  onOpenChange,
  onOpenCreate,
}: PermissionFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  const isEditing = !!editingPermission;
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

  const form = useForm<PermissionFormData>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      employeeId: "",
      datedebut: "",
      datefin: "",
      titre: "EN_ATTENTE",
      description: "",
    },
  });

  useEffect(() => {
    if (editingPermission) {
      form.reset({
        employeeId: editingPermission.employeeId,
        datedebut: editingPermission.datedebut.split("T")[0],
        datefin: editingPermission.datefin.split("T")[0],
        titre: editingPermission.titre as PermissionFormData["titre"],
        description: editingPermission.description,
      });
    } else {
      form.reset({
        employeeId: "",
        datedebut: "",
        datefin: "",
        titre: "EN_ATTENTE",
        description: "",
      });
    }
  }, [editingPermission, form]);

  const onSubmit = async (data: PermissionFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing && editingPermission) {
        const result = await updatePermission(editingPermission.id, {
          employeeId: data.employeeId,
          datedebut: new Date(data.datedebut).toISOString(),
          datefin: new Date(data.datefin).toISOString(),
          titre: data.titre as "EN_ATTENTE" | "VALIDE" | "EN_COURS" | "TERMINEE" | "ANNULE",
          description: data.description,
        });
        if (result.success) {
          toast.success("Permission modifiée avec succès !");
          setIsOpen(false);
          onSuccess?.();
        } else {
          toast.error(result.error || "Erreur lors de la modification de la permission");
        }
      } else {
        const result = await createPermission({
          employeeId: data.employeeId,
          datedebut: new Date(data.datedebut).toISOString(),
          datefin: new Date(data.datefin).toISOString(),
          titre: data.titre as "EN_ATTENTE" | "VALIDE" | "EN_COURS" | "TERMINEE" | "ANNULE",
          description: data.description,
        });
        if (result.success) {
          toast.success("Permission créée avec succès !");
          form.reset({
            employeeId: "",
            datedebut: "",
            datefin: "",
            titre: "EN_ATTENTE",
            description: "",
          });
          setIsOpen(false);
          onSuccess?.();
        } else {
          toast.error(result.error || "Erreur lors de la création de la permission");
        }
      }
    } catch (error) {
      console.error(isEditing ? "Error updating permission:" : "Error creating permission:", error);
      toast.error(isEditing ? "Erreur lors de la modification de la permission" : "Erreur lors de la création de la permission");
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
              <CalendarClock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div>
            <DialogTitle className="text-lg font-semibold">
              {isEditing ? "Modifier la permission" : "Créer une permission"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {isEditing ? "Modifiez les informations de la permission" : "Remplissez le formulaire pour créer une demande de permission"}
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
              name="titre"
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez la raison de la permission..."
                      className="min-h-[80px] resize-y"
                      {...field}
                    />
                  </FormControl>
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
                  "Créer la permission"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
