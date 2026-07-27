"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Briefcase, Loader2, Plus, Trash2, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  deleteRoleMissionProjetRoutine,
  type RoleMissionProjetRoutineListItem,
  type UserForRoleMissionOption,
} from "@/lib/actions/role-mission-projet-routine";
import CreerRoleMissionDialog from "./CreerRoleMissionDialog";

const ROLE_LABELS: Record<string, string> = {
  COMMUNICATION: "Communication",
  INFOGRAPHIE: "Infographie",
  COMMUNITY_MANAGER: "Community manager",
  COMMERCIAL: "Commercial",
};

type Props = {
  initialRoles: RoleMissionProjetRoutineListItem[];
  users: UserForRoleMissionOption[];
};

export default function CreerRoleMissionPanel({ initialRoles, users }: Props) {
  const [roles, setRoles] = useState(initialRoles);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteRoleMissionProjetRoutine(id);
    setDeletingId(null);

    if (result.success) {
      setRoles((prev) => prev.filter((role) => role.id !== id));
      toast.success("Rôle supprimé.");
    } else {
      toast.error(result.error);
    }
  }

  async function refreshRoles() {
    const { getRoleMissionsProjetRoutine } = await import(
      "@/lib/actions/role-mission-projet-routine"
    );
    const result = await getRoleMissionsProjetRoutine();
    if (result.success) {
      setRoles(result.roles);
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-600">
            {roles.length} rôle{roles.length !== 1 ? "s" : ""} et mission
            {roles.length !== 1 ? "s" : ""} configuré{roles.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="h-11 w-full rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 shadow-md shadow-indigo-500/20 hover:from-indigo-700 hover:via-blue-700 hover:to-cyan-700 sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Créer Role &amp; Mission
        </Button>
      </div>

      {roles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 px-6 py-14 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-600 text-white shadow-lg">
            <Briefcase className="h-7 w-7" />
          </div>
          <p className="text-base font-semibold text-slate-900">Aucun rôle défini</p>
          <p className="mt-1 max-w-md text-sm text-slate-600">
            Créez votre premier rôle en sélectionnant un responsable. Son rôle sera
            automatiquement enregistré comme libellé.
          </p>
          <Button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="mt-5 rounded-xl bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Créer Role &amp; Mission
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => {
            const responsable = role.responsables[0];
            return (
              <article
                key={role.id}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-100 transition hover:shadow-md"
              >
                <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-500/8 to-cyan-500/5 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Badge
                        variant="outline"
                        className="mb-2 rounded-full border-indigo-200 bg-indigo-50 text-indigo-800"
                      >
                        Rôle mission
                      </Badge>
                      <h3 className="truncate text-base font-bold text-slate-900">
                        {role.libelle}
                      </h3>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => handleDelete(role.id)}
                      disabled={deletingId === role.id}
                      aria-label="Supprimer le rôle"
                    >
                      {deletingId === role.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 px-4 py-4">
                  {responsable && (
                    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                        <UserCircle2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {responsable.userName}
                        </p>
                        <p className="truncate text-xs text-slate-500">{responsable.userEmail}</p>
                        <p className="mt-0.5 text-xs text-indigo-700">
                          {ROLE_LABELS[responsable.userRole] ??
                            responsable.userRole.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                  )}

                  {role.description ? (
                    <p className="text-sm leading-relaxed text-slate-600">{role.description}</p>
                  ) : (
                    <p className="text-sm italic text-slate-400">Aucune description</p>
                  )}

                  <p className="text-xs text-slate-400">
                    Créé le{" "}
                    {format(new Date(role.createdAt), "d MMMM yyyy", { locale: fr })}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <CreerRoleMissionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        users={users}
        onSuccess={refreshRoles}
      />
    </div>
  );
}
