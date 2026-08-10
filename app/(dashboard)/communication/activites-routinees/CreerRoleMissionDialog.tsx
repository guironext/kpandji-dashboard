"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, Loader2, Plus, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createRoleMissionProjetRoutine,
  type UserForRoleMissionOption,
} from "@/lib/actions/role-mission-projet-routine";

const inputClass =
  "rounded-xl border-slate-200/90 bg-white shadow-sm transition focus-visible:border-indigo-300 focus-visible:ring-indigo-500/25";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserForRoleMissionOption[];
  onSuccess?: () => void;
};

export default function CreerRoleMissionDialog({
  open,
  onOpenChange,
  users,
  onSuccess,
}: Props) {
  const [userId, setUserId] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === userId) ?? null,
    [users, userId]
  );

  useEffect(() => {
    if (!open) {
      setUserId("");
      setDescription("");
      setSaving(false);
    }
  }, [open]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!userId) {
      toast.error("Sélectionnez un responsable.");
      return;
    }

    setSaving(true);
    const result = await createRoleMissionProjetRoutine({
      userId,
      description: description.trim() || undefined,
    });
    setSaving(false);

    if (result.success) {
      toast.success("Rôle et mission créés avec succès.");
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92dvh,720px)] overflow-y-auto rounded-2xl border-slate-200/80 p-0 sm:max-w-lg">
        <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-500/10 via-blue-500/5 to-cyan-500/5 px-5 py-5 sm:px-6">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-600 text-white shadow-md">
              <Briefcase className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Créer Role &amp; Mission
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-slate-600">
              Choisissez le responsable. Son rôle actuel sera utilisé comme libellé du rôle
              mission.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5 sm:px-6">
          <div className="space-y-2">
            <Label htmlFor="responsable-user">Responsable *</Label>
            <Select value={userId || undefined} onValueChange={setUserId}>
              <SelectTrigger id="responsable-user" className={cn("h-11 w-full", inputClass)}>
                <SelectValue placeholder="Sélectionner un utilisateur" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <span className="flex flex-col items-start gap-0.5 py-0.5">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs text-slate-500">
                        {user.roleLabel} · {user.department}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-libelle">Libellé du rôle (automatique)</Label>
            <div
              id="role-libelle"
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl border border-indigo-200/80 bg-indigo-50/60 px-3.5 py-2.5",
                !selectedUser && "text-slate-400"
              )}
            >
              <UserCircle2 className="h-5 w-5 shrink-0 text-indigo-500" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {selectedUser ? selectedUser.roleLabel : "Sélectionnez un responsable"}
                </p>
                {selectedUser && (
                  <p className="text-xs text-slate-500">
                    Rôle système : {selectedUser.role.replace(/_/g, " ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-description">Description de la mission (optionnel)</Label>
            <Textarea
              id="role-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Précisez la mission ou le périmètre de responsabilité..."
              className={cn("min-h-[100px] resize-none", inputClass)}
            />
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl sm:w-auto"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 sm:w-auto"
              disabled={saving || !userId}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
