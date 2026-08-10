"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, UserCog, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UserForActorOption } from "@/lib/actions/communication-actor";
import {
  setActiviteResponsables,
  type ProjetPonctuelActiviteItem,
} from "@/lib/actions/projet-ponctuel-activite";
import ResponsableUserPicker from "./ResponsableUserPicker";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activite: ProjetPonctuelActiviteItem | null;
  projetPonctuelId: string;
  users: UserForActorOption[];
  isLoadingUsers: boolean;
  onSuccess?: (activite: ProjetPonctuelActiviteItem) => void;
};

export default function ResponsablesActiviteDialog({
  open,
  onOpenChange,
  activite,
  projetPonctuelId,
  users,
  isLoadingUsers,
  onSuccess,
}: Props) {
  const [selectedResponsables, setSelectedResponsables] = useState<string[]>([]);
  const [responsableSearch, setResponsableSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && activite) {
      setSelectedResponsables(activite.responsables.map((r) => r.userId));
      setResponsableSearch("");
    }
  }, [open, activite]);

  const handleSave = async () => {
    if (!activite) return;

    setIsSaving(true);
    try {
      const result = await setActiviteResponsables(
        activite.id,
        projetPonctuelId,
        selectedResponsables
      );
      if (result.success) {
        toast.success("Responsables mis à jour.");
        onSuccess?.(result.activite);
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Erreur lors de la mise à jour.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour des responsables.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-h-[min(90dvh,720px)] w-[calc(100%-1rem)] max-w-lg flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl sm:w-full",
          "top-auto bottom-0 translate-y-0 sm:top-[50%] sm:bottom-auto sm:translate-y-[-50%]"
        )}
      >
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-teal-600 via-cyan-600 to-sky-600 px-5 pb-5 pt-6 sm:px-6">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.16),transparent_50%)]"
            aria-hidden
          />
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25">
              <UserCog className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1 pr-8">
              <DialogTitle className="text-left text-xl font-bold text-white">
                Gérer les responsables
              </DialogTitle>
              <DialogDescription className="mt-1.5 line-clamp-2 text-left text-sm text-white/85">
                {activite?.titre ?? "Activité"}
              </DialogDescription>
            </div>
          </div>
          <div className="relative mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white/90 ring-1 ring-white/20">
            <Sparkles className="h-3 w-3 text-amber-300" />
            Affectation multi-utilisateurs
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-slate-50/80 to-white px-4 py-4 sm:px-5 sm:py-5">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-100/80 sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-teal-100">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Équipe responsable</h3>
                <p className="text-xs text-slate-500">
                  Cochez les personnes en charge de cette activité
                </p>
              </div>
            </div>

            <ResponsableUserPicker
              users={users}
              selectedIds={selectedResponsables}
              onChange={setSelectedResponsables}
              search={responsableSearch}
              onSearchChange={setResponsableSearch}
              isLoading={isLoadingUsers}
              maxHeightClass="max-h-64"
            />
          </section>
        </div>

        <div className="shrink-0 border-t border-slate-200/80 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-5">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="h-11 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 shadow-lg shadow-teal-500/20 hover:from-teal-700 hover:to-sky-700"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
