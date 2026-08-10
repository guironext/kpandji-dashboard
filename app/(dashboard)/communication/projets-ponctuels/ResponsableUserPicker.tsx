"use client";

import { useMemo } from "react";
import { Loader2, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { UserForActorOption } from "@/lib/actions/communication-actor";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_GRADIENTS = [
  "from-sky-500 to-cyan-500",
  "from-teal-500 to-emerald-500",
  "from-indigo-500 to-blue-500",
  "from-violet-500 to-purple-500",
  "from-amber-500 to-orange-500",
];

type Props = {
  users: UserForActorOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  search: string;
  onSearchChange: (value: string) => void;
  isLoading?: boolean;
  maxHeightClass?: string;
  emptyMessage?: string;
};

export default function ResponsableUserPicker({
  users,
  selectedIds,
  onChange,
  search,
  onSearchChange,
  isLoading = false,
  maxHeightClass = "max-h-56",
  emptyMessage = "Aucun utilisateur trouvé.",
}: Props) {
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.department.toLowerCase().includes(query) ||
        user.job.toLowerCase().includes(query)
    );
  }, [users, search]);

  const selectedUsers = useMemo(
    () => users.filter((user) => selectedIds.includes(user.id)),
    [users, selectedIds]
  );

  const toggleUser = (userId: string, checked: boolean) => {
    onChange(
      checked ? [...selectedIds, userId] : selectedIds.filter((id) => id !== userId)
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher par nom, email, service..."
          className="h-11 rounded-xl border-slate-200/90 bg-white pl-10 shadow-sm focus-visible:border-sky-300 focus-visible:ring-sky-500/25"
        />
      </div>

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-sky-100 bg-sky-50/50 p-2.5">
          {selectedUsers.map((user, index) => (
            <span
              key={user.id}
              className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm"
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white",
                  AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
                )}
              >
                {initials(user.name)}
              </span>
              {user.name}
            </span>
          ))}
        </div>
      )}

      <div
        className={cn(
          "space-y-2 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/40 p-2",
          maxHeightClass
        )}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-sky-500" />
            Chargement des utilisateurs...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Users className="mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">{emptyMessage}</p>
          </div>
        ) : (
          filteredUsers.map((user, index) => {
            const checked = selectedIds.includes(user.id);
            return (
              <label
                key={user.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition-all",
                  checked
                    ? "border-sky-300 bg-white shadow-sm ring-1 ring-sky-200"
                    : "border-transparent bg-white/80 hover:border-slate-200 hover:bg-white hover:shadow-sm"
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) => toggleUser(user.id, value === true)}
                />
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white shadow-sm",
                    AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
                  )}
                >
                  {initials(user.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    {user.name}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {user.job} · {user.department}
                  </span>
                </span>
              </label>
            );
          })
        )}
      </div>

      <p className="text-xs font-medium text-slate-500">
        {selectedIds.length} responsable{selectedIds.length !== 1 ? "s" : ""} sélectionné
        {selectedIds.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
