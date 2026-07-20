"use client";

import { useEffect, useState } from "react";
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
  transferActiviteToResponsable,
  type ProjetPonctuelActiviteItem,
} from "@/lib/actions/projet-ponctuel-activite";
import ResponsableUserPicker from "./ResponsableUserPicker";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activite: ProjetPonctuelActiviteItem | null;
  users: UserForActorOption[];
  isLoadingUsers: boolean;
  excludeUserIds?: string[];
  onSuccess?: (activite: ProjetPonctuelActiviteItem) => void;
  onTransferredAway?: () => void;
};

export default function TransferActiviteDialog({
  open,
  onOpenChange,
  activite,
  users,
  isLoadingUsers,
  excludeUserIds = [],
  onSuccess,
  onTransferredAway,
}: Props) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const availableUsers = users.filter((u) => !excludeUserIds.includes(u.id));

  useEffect(() => {
    if (open) {
      setSelectedUserId("");
      setUserSearch("");
    }
  }, [open, activite?.id]);

  const handleTransfer = async () => {
    if (!activite || !selectedUserId) {
      toast.error("Veuillez sélectionner un responsable.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await transferActiviteToResponsable(
        activite.id,
        activite.projetPonctuelId,
        selectedUserId
      );
      if (result.success) {
        toast.success("Activité transférée au nouveau responsable.");
        onSuccess?.(result.activite);
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
        <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50 via-white to-fuchsia-50/80 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-sm">
              <ArrowRightLeft className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold text-slate-900">
                Transférer l&apos;activité
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-sm text-slate-600">
                {activite?.titre ?? "Sélectionnez le nouveau responsable"}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="mb-3 text-xs text-slate-600">
            L&apos;activité repassera au statut <strong>Nouveau</strong> et ne sera visible que par
            le responsable choisi.
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
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
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
