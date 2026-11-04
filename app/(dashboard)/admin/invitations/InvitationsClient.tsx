"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { UserRole } from "@prisma/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createInvitation,
  listInvitations,
  rejectInvitation,
  validateInvitation,
  type InvitationRow,
} from "@/lib/actions/invitation";
import { ASSIGNABLE_ROLES, getRoleLabel, ROLE_LABELS } from "@/lib/role-labels";
import UserActions from "./UserActions";

export type UserListRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  department: string | null;
  telephone: string | null;
  isActive: boolean;
  createdAt: string;
  clerkId: string;
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Envoyée", className: "bg-blue-50 text-blue-700 ring-blue-200" },
  WAITING_VALIDATION: { label: "À valider", className: "bg-amber-50 text-amber-800 ring-amber-200" },
  ACCEPTED: { label: "Validée", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  REJECTED: { label: "Refusée", className: "bg-red-50 text-red-700 ring-red-200" },
  REVOKED: { label: "Annulée", className: "bg-gray-100 text-gray-600 ring-gray-200" },
  EXPIRED: { label: "Expirée", className: "bg-gray-100 text-gray-500 ring-gray-200" },
};

type Filter = "ALL" | "TO_VALIDATE" | "SENT" | "DONE";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL", label: "Toutes" },
  { key: "TO_VALIDATE", label: "À valider" },
  { key: "SENT", label: "Envoyées" },
  { key: "DONE", label: "Terminées" },
];

function StatusBadge({ statusKey }: { statusKey: string }) {
  const s = STATUS_LABELS[statusKey] ?? { label: statusKey, className: "bg-gray-100 text-gray-600 ring-gray-200" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.className}`}>
      {s.label}
    </span>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="min-w-0 rounded-xl border bg-white px-3 py-2.5 shadow-sm sm:px-4 sm:py-3">
      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-gray-500 sm:text-xs">{label}</p>
      <p className={`mt-0.5 text-xl font-bold tabular-nums sm:mt-1 sm:text-2xl ${tone}`}>{value}</p>
    </div>
  );
}

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Lien copié");
  } catch {
    toast.error("Copie impossible, sélectionnez le lien manuellement");
  }
}

export default function InvitationsClient({ users = [], currentClerkId = null }: { users?: UserListRow[]; currentClerkId?: string | null }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [sending, setSending] = useState(false);
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [rows, setRows] = useState<InvitationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [lastEmailSent, setLastEmailSent] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const refresh = useCallback(async () => {
    const result = await listInvitations();
    if (result.success) setRows(result.data);
    else toast.error(result.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !role) {
      toast.error("Renseignez l'email et le rôle");
      return;
    }
    setSending(true);
    const result = await createInvitation({ email, role });
    setSending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setLastLink(result.link);
    setLastEmailSent(!!result.emailSent);
    if (result.emailSent) {
      toast.success(`Invitation envoyée par email à ${email.trim()}`);
    } else {
      toast.warning("Invitation créée, mais l'email n'a pas pu être envoyé : partagez le lien ci-dessous.");
    }
    setEmail("");
    setRole("");
    refresh();
  };

  const handleDecision = async (id: string, action: "validate" | "reject") => {
    if (action === "reject" && !confirm("Confirmer le refus / l'annulation de cette invitation ?")) return;
    setBusyId(id);
    const result = action === "validate" ? await validateInvitation(id) : await rejectInvitation(id);
    setBusyId(null);
    if (result.success) {
      toast.success(action === "validate" ? "Compte validé" : "Invitation refusée");
      refresh();
    } else {
      toast.error(result.error);
    }
  };

  const statusOf = (r: InvitationRow) => (r.expired && r.status === "PENDING" ? "EXPIRED" : r.status);
  const counts = useMemo(() => {
    const c = { sent: 0, toValidate: 0, accepted: 0 };
    rows.forEach((r) => {
      const k = statusOf(r);
      if (k === "PENDING") c.sent++;
      else if (k === "WAITING_VALIDATION") c.toValidate++;
      else if (k === "ACCEPTED") c.accepted++;
    });
    return c;
  }, [rows]);

  const visible = rows.filter((r) => {
    const k = statusOf(r);
    if (filter === "TO_VALIDATE" && k !== "WAITING_VALIDATION") return false;
    if (filter === "SENT" && k !== "PENDING") return false;
    if (filter === "DONE" && (k === "PENDING" || k === "WAITING_VALIDATION")) return false;
    return !search.trim() || r.email.toLowerCase().includes(search.trim().toLowerCase());
  });

  const visibleUsers = users.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return [u.firstName, u.lastName, u.email, u.department ?? "", ROLE_LABELS[u.role] ?? ""].join(" ").toLowerCase().includes(q);
  });

  const renderActions = (row: InvitationRow) => {
    const busy = busyId === row.id;
    const k = statusOf(row);
    if (k === "WAITING_VALIDATION")
      return (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={busy} onClick={() => handleDecision(row.id, "validate")} className="bg-emerald-600 text-white hover:bg-emerald-700">
            {busy ? "..." : "Valider"}
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => handleDecision(row.id, "reject")} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
            Refuser
          </Button>
        </div>
      );
    if (k === "PENDING" && row.link)
      return (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => copyToClipboard(row.link!)}>Copier le lien</Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => handleDecision(row.id, "reject")} className="text-gray-500 hover:text-red-600">
            Annuler
          </Button>
        </div>
      );
    return <span className="text-xs text-gray-400">—</span>;
  };

  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6 overflow-x-hidden p-3 sm:p-4 md:space-y-8 md:p-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">Administration</p>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">Invitations &amp; utilisateurs</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Invitez un collaborateur par email avec son futur rôle. Il s&apos;inscrit avec ce rôle verrouillé, puis vous validez ou refusez son accès.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:w-[420px] md:shrink-0">
          <StatCard label="Envoyées" value={counts.sent} tone="text-blue-700" />
          <StatCard label="À valider" value={counts.toValidate} tone="text-amber-600" />
          <StatCard label="Validées" value={counts.accepted} tone="text-emerald-700" />
        </div>
      </header>

      <form onSubmit={handleSend} className="rounded-2xl border border-t-4 border-t-amber-400 bg-white p-4 shadow-sm sm:p-5 md:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Nouvelle invitation</h2>
          <p className="text-sm text-gray-500">Le lien est valable 7 jours. Le rôle Admin ne peut pas être attribué par invitation.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_240px_auto] md:items-end">
          <div className="space-y-1.5">
            <label htmlFor="invite-email" className="text-sm font-medium text-gray-700">Adresse email</label>
            <Input id="invite-email" type="email" placeholder="prenom.nom@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={sending} required className="h-11 md:h-10" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Rôle</label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)} disabled={sending}>
              <SelectTrigger aria-label="Rôle" className="h-11 w-full md:h-10">
                <SelectValue placeholder="Choisir un rôle" />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={sending || !email.trim() || !role} className="h-11 w-full bg-black px-6 font-semibold text-amber-400 hover:bg-gray-800 md:h-10 md:w-auto">
            {sending ? "Envoi en cours..." : "Envoyer l'invitation"}
          </Button>
        </div>
        {lastLink && (
          <div className={`mt-5 rounded-xl border p-4 ${lastEmailSent ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
            <p className={`text-sm font-semibold ${lastEmailSent ? "text-emerald-800" : "text-amber-900"}`}>
              {lastEmailSent ? "Invitation envoyée par email ✓" : "Email non envoyé — partagez le lien manuellement"}
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 break-all rounded-lg border bg-white px-3 py-2 text-xs text-gray-700">{lastLink}</code>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Button type="button" size="sm" onClick={() => copyToClipboard(lastLink)} className="h-10 bg-black text-amber-400 hover:bg-gray-800">Copier</Button>
                <Button type="button" size="sm" variant="ghost" className="h-10" onClick={() => setLastLink(null)}>Fermer</Button>
              </div>
            </div>
          </div>
        )}
      </form>

      <section className="min-w-0 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-4 pt-4"><h2 className="text-lg font-semibold text-gray-900">Invitations envoyées</h2></div>
        <div className="flex min-w-0 flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 md:pb-0">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition ${filter === f.key ? "bg-black text-amber-400" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {f.label}
                {f.key === "TO_VALIDATE" && counts.toValidate > 0 && (
                  <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 text-xs text-white">{counts.toValidate}</span>
                )}
              </button>
            ))}
          </div>
          <Input placeholder="Rechercher un email..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 w-full md:h-9 md:w-64" aria-label="Rechercher une invitation" type="search" />
        </div>

        {loading ? (
          <div className="space-y-3 p-4 md:p-6">
            {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100 md:h-10 md:rounded-lg" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-xl text-amber-600">✉</span>
            <p className="font-medium text-gray-800">{rows.length === 0 ? "Aucune invitation pour le moment" : "Aucun résultat"}</p>
            <p className="text-sm text-gray-500">
              {rows.length === 0 ? "Envoyez votre première invitation avec le formulaire ci-dessus." : "Modifiez le filtre ou la recherche."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Rôle</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Envoyée / Expire</th>
                    <th className="px-4 py-3">Inscrit</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {visible.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.email}</td>
                      <td className="px-4 py-3 text-gray-700">{getRoleLabel(row.role)}</td>
                      <td className="px-4 py-3"><StatusBadge statusKey={statusOf(row)} /></td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(row.createdAt)}
                        <span className="block text-xs text-gray-400">exp. {formatDate(row.expiresAt)}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{row.acceptedByName ?? (row.acceptedAt ? "Oui" : "—")}</td>
                      <td className="px-4 py-3"><div className="flex justify-end">{renderActions(row)}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="bg-gray-50/60 md:hidden">
              {visible.map((row) => (
                <li key={row.id} className="p-3">
                  <div className="space-y-3 rounded-xl border bg-white p-3.5 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 break-all font-medium text-gray-900">{row.email}</p>
                      <div className="shrink-0"><StatusBadge statusKey={statusOf(row)} /></div>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                      <div><dt className="text-gray-400">Rôle</dt><dd className="font-medium text-gray-800">{getRoleLabel(row.role)}</dd></div>
                      <div><dt className="text-gray-400">Inscrit</dt><dd className="truncate font-medium text-gray-800">{row.acceptedByName ?? (row.acceptedAt ? "Oui" : "—")}</dd></div>
                      <div><dt className="text-gray-400">Envoyée le</dt><dd className="text-gray-700">{formatDate(row.createdAt)}</dd></div>
                      <div><dt className="text-gray-400">Expire le</dt><dd className="text-gray-700">{formatDate(row.expiresAt)}</dd></div>
                    </dl>
                    <div className="border-t pt-3 [&_button]:h-10 [&_button]:flex-1">{renderActions(row)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="min-w-0 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex min-w-0 flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Utilisateurs <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-sm font-medium text-gray-600">{users.length}</span>
            </h2>
            <p className="text-sm text-gray-500">Tous les comptes enregistrés dans la base.</p>
          </div>
          <Input placeholder="Rechercher nom, email, rôle..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="h-11 w-full md:h-9 md:w-72" aria-label="Rechercher un utilisateur" type="search" />
        </div>
        {visibleUsers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500">👤</span><p className="text-sm text-gray-500">Aucun utilisateur trouvé.</p></div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Nom</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Rôle</th>
                    <th className="px-4 py-3">Département</th>
                    <th className="px-4 py-3">Téléphone</th>
                    <th className="px-4 py-3">Inscrit le</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {visibleUsers.map((u) => (
                    <tr key={u.id} className={u.isActive ? "hover:bg-gray-50/60" : "bg-gray-50 text-gray-400 opacity-70"}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-amber-400">
                            {(u.firstName[0] ?? "") + (u.lastName[0] ?? "") || u.email[0]?.toUpperCase()}
                          </span>
                          <span className="font-medium text-gray-900">{`${u.firstName} ${u.lastName}`.trim() || "—"}</span>
                          {!u.isActive && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-inset ring-red-200">Désactivé</span>}
                        </div>
                      </td>
                      <td className="max-w-[240px] truncate px-4 py-3 text-gray-700" title={u.email}>{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${u.role === "ADMIN" ? "bg-black text-amber-400 ring-black" : "bg-gray-50 text-gray-700 ring-gray-200"}`}>
                          {getRoleLabel(u.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.department || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{u.telephone || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3"><UserActions user={u} isSelf={u.clerkId === currentClerkId} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="bg-gray-50/60 md:hidden">
              {visibleUsers.map((u) => (
                <li key={u.id} className="p-3">
                  <div className={`rounded-xl border bg-white p-3.5 shadow-sm ${u.isActive ? "" : "opacity-70"}`}>
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-sm font-bold text-amber-400">
                        {(u.firstName[0] ?? "") + (u.lastName[0] ?? "") || u.email[0]?.toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900">{`${u.firstName} ${u.lastName}`.trim() || u.email}</p>
                        <p className="break-all text-sm text-gray-600">{u.email}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${u.role === "ADMIN" ? "bg-black text-amber-400 ring-black" : "bg-gray-50 text-gray-700 ring-gray-200"}`}>{getRoleLabel(u.role)}</span>
                          {!u.isActive && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-inset ring-red-200">Désactivé</span>}
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">{[u.department, u.telephone, `Inscrit le ${formatDate(u.createdAt)}`].filter(Boolean).join(" · ")}</p>
                    <div className="mt-3 border-t pt-3"><UserActions user={u} isSelf={u.clerkId === currentClerkId} /></div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
