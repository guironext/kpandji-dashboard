"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UserForActorOption } from "@/lib/actions/communication-actor";
import {
  transferTacheToResponsable,
  type TacheActiviteProjetRoutineListItem,
} from "@/lib/actions/tache-activite-projet-routine";
import ResponsableUserPicker from "@/app/(dashboard)/communication/projets-ponctuels/ResponsableUserPicker";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tache: TacheActiviteProjetRoutineListItem | null;
  users: UserForActorOption[];
  isLoadingUsers: boolean;
  excludeUserIds?: string[];
  onTransferredAway?: () => void;
  onSuccess?: (tache: TacheActiviteProjetRoutineListItem) => void;
};

export default function TransferTacheDialog({
  open,
  onOpenChange,
  tache,
  users,
  isLoadingUsers,
  excludeUserIds = [],
  onTransferredAway,
  onSuccess,
}: Props) {
  const { user: clerkUser } = useUser();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const availableUsers = users.filter((u) => !excludeUserIds.includes(u.id));

  useEffect(() => {
    if (open) {
      setSelectedUserId("");
      setUserSearch("");
    }
  }, [open, tache?.id]);

  const handleTransfer = async () => {
    if (!tache || !selectedUserId) {
      toast.error("Veuillez sélectionner un responsable.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await transferTacheToResponsable(
        tache.id,
        tache.activiteProjetRoutineId,
        selectedUserId,
        clerkUser?.id
      );
      if (result.success) {
        toast.success("Tâche transférée au nouveau responsable.");
        onSuccess?.(result.tache);
        onTransferredAway?.();
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Erreur lors du transfert.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du transfert.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-2xl p-0">
        <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-teal-50/80 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
              <ArrowRightLeft className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold text-slate-900">
                Transférer la tâche
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-sm text-slate-600">
                {tache?.libelle ?? "Sélectionnez le nouveau responsable"}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="mb-3 text-xs text-slate-600">
            La tâche repassera au statut <strong>Nouveau</strong> et ne sera visible que par le
            responsable choisi.
          </p>
          <ResponsableUserPicker
            users={availableUsers}
            selectedIds={selectedUserId ? [selectedUserId] : []}
            onChange={(ids) => setSelectedUserId(ids[ids.length - 1] ?? "")}
            search={userSearch}
            onSearchChange={setUserSearch}
            isLoading={isLoadingUsers}
            maxHeightClass="max-h-56"
            emptyMessage="Aucun utilisateur disponible."
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button
            type="button"
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            onClick={() => void handleTransfer()}
            disabled={isSaving || !selectedUserId}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ArrowRightLeft className="mr-1.5 h-4 w-4" />
                Transférer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
