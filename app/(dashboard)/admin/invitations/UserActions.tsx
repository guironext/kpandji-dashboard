"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";
import { Eye, Loader2, Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deactivateUserByAdmin, deleteUserByAdmin, reactivateUserByAdmin, getUserDetails, updateUserByAdmin, type AdminUserDetails } from "@/lib/actions/admin-users";
import { getRoleLabel, ROLE_LABELS } from "@/lib/role-labels";
import type { UserListRow } from "./InvitationsClient";

const fmt = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString("fr-FR") : "—");
const yesNo = (v: boolean | null | undefined) => (v === null || v === undefined ? "—" : v ? "Oui" : "Non");

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className={`mt-0.5 break-all text-sm text-gray-900 ${mono ? "font-mono text-xs" : ""}`}>{value || "—"}</dd>
    </div>
  );
}

const SHEET = "top-auto bottom-0 translate-y-0 max-w-full gap-0 overflow-hidden rounded-b-none rounded-t-2xl p-0 max-h-[92dvh] flex flex-col sm:top-[50%] sm:bottom-auto sm:translate-y-[-50%] sm:max-w-[calc(100%-2rem)] sm:rounded-2xl sm:max-h-[85vh]";
const HEAD = "shrink-0 border-b px-5 pt-5 pb-4 pr-12 text-left";
const BODY = "flex-1 overflow-y-auto overscroll-contain px-5 py-4";
const FOOT = "shrink-0 border-t bg-white px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] [&_button]:h-11 sm:[&_button]:h-10";

const iconBtn = "inline-flex h-10 w-10 md:h-9 md:w-9 items-center justify-center rounded-lg border bg-white text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40";

export default function UserActions({ user, isSelf }: { user: UserListRow; isSelf: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit" | "delete" | "deactivate" | null>(null);
  const [details, setDetails] = useState<AdminUserDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as UserRole,
    department: user.department ?? "",
    telephone: user.telephone ?? "",
  });

  const openView = async () => {
    setMode("view");
    setLoading(true);
    const res = await getUserDetails(user.id);
    setLoading(false);
    if (res.success) setDetails(res.data);
    else { toast.error(res.error); setMode(null); }
  };

  const openEdit = () => {
    setForm({ firstName: user.firstName, lastName: user.lastName, role: user.role, department: user.department ?? "", telephone: user.telephone ?? "" });
    setMode("edit");
  };

  const save = async () => {
    setBusy(true);
    const res = await updateUserByAdmin(user.id, form);
    setBusy(false);
    if (!res.success) return toast.error(res.error);
    if (res.warning) toast.warning(res.warning); else toast.success("Utilisateur mis à jour");
    setMode(null);
    router.refresh();
  };

  const remove = async () => {
    setBusy(true);
    const res = await deleteUserByAdmin(user.id);
    setBusy(false);
    if (!res.success) {
      if ("canDeactivate" in res && res.canDeactivate) { setBlocked(true); return; }
      toast.error(res.error);
      return;
    }
    if (res.warning) toast.warning(res.warning); else toast.success("Utilisateur supprimé");
    setMode(null);
    router.refresh();
  };

  const toggleActive = async () => {
    setBusy(true);
    const res = user.isActive ? await deactivateUserByAdmin(user.id) : await reactivateUserByAdmin(user.id);
    setBusy(false);
    if (!res.success) return toast.error(res.error);
    if (res.warning) toast.warning(res.warning); else toast.success(user.isActive ? `Compte de ${user.firstName} ${user.lastName} désactivé` : `Compte de ${user.firstName} ${user.lastName} réactivé`);
    setBlocked(false);
    setMode(null);
    router.refresh();
  };

  const fullName = `${user.firstName} ${user.lastName}`.trim() || user.email;

  return (
    <>
      <div className="flex items-center justify-end gap-2 md:gap-1.5">
        <button type="button" className={iconBtn} title="Voir" aria-label="Voir" onClick={openView}><Eye className="h-4 w-4" /></button>
        <button type="button" className={iconBtn} title="Modifier" aria-label="Modifier" onClick={openEdit}><Pencil className="h-4 w-4" /></button>
        {user.isActive ? (
          <button type="button" className={`${iconBtn} border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100`} title={isSelf ? "Vous ne pouvez pas désactiver votre propre compte" : "Désactiver"} aria-label="Désactiver" disabled={isSelf} onClick={() => setMode("deactivate")}><UserX className="h-4 w-4" /></button>
        ) : (
          <button type="button" className={`${iconBtn} border-emerald-200 text-emerald-700 hover:bg-emerald-50`} title="Réactiver" aria-label="Réactiver" disabled={busy} onClick={toggleActive}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}</button>
        )}
        <button
          type="button"
          className={`${iconBtn} border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700`}
          title={isSelf ? "Vous ne pouvez pas supprimer votre propre compte" : "Supprimer"}
          aria-label="Supprimer"
          disabled={isSelf}
          onClick={() => { setBlocked(false); setMode("delete"); }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <Dialog open={mode === "view"} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent className={`${SHEET} sm:max-w-2xl`}>
          <DialogHeader className={HEAD}>
            <DialogTitle>Détails de l&apos;utilisateur</DialogTitle>
            <DialogDescription>{fullName}</DialogDescription>
          </DialogHeader>
          {loading || !details ? (
            <div className={`${BODY} flex justify-center py-10`}><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
          ) : (
            <div className={`${BODY} space-y-4`}>
              <div className="flex items-center gap-3">
                {details.clerk?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={details.clerk.imageUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black font-bold text-amber-400">
                    {(details.firstName[0] ?? "") + (details.lastName[0] ?? "")}
                  </span>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{`${details.firstName} ${details.lastName}`}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${details.role === "ADMIN" ? "bg-black text-amber-400 ring-black" : "bg-gray-50 text-gray-700 ring-gray-200"}`}>{getRoleLabel(details.role)}</span>
                  {details.isSelf && <span className="ml-2 text-xs text-gray-500">(vous)</span>}
                </div>
              </div>
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Field label="Prénom" value={details.firstName} />
                <Field label="Nom" value={details.lastName} />
                <Field label="Email" value={details.email} />
                <Field label="Téléphone" value={details.telephone} />
                <Field label="Département" value={details.department} />
                <Field label="Rôle" value={getRoleLabel(details.role)} />
                <Field label="Statut" value={details.isActive ? "Actif" : `Désactivé le ${fmt(details.disabledAt)}`} />
                <Field label="Inscrit le" value={fmt(details.createdAt)} />
                <Field label="Mis à jour le" value={fmt(details.updatedAt)} />
                <Field label="ID" value={details.id} mono />
                <Field label="Clerk ID" value={details.clerkId} mono />
              </dl>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Compte Clerk</p>
                {details.clerk ? (
                  <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Field label="Dernière connexion" value={fmt(details.clerk.lastSignInAt)} />
                    <Field label="Créé sur Clerk" value={fmt(details.clerk.createdAt)} />
                    <Field label="Onboarding terminé" value={yesNo(details.clerk.onboardingCompleted)} />
                    <Field label="En attente de validation" value={yesNo(details.clerk.pendingValidation)} />
                    <Field label="Rôle (Clerk)" value={details.clerk.metadataRole ? getRoleLabel(details.clerk.metadataRole) : "—"} />
                    <Field label="Banni" value={yesNo(details.clerk.banned)} />
                  </dl>
                ) : (
                  <p className="text-sm text-gray-500">Informations Clerk indisponibles.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={mode === "edit"} onOpenChange={(o) => !o && !busy && setMode(null)}>
        <DialogContent className={`${SHEET} sm:max-w-lg`}>
          <DialogHeader className={HEAD}>
            <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
            <DialogDescription>{user.email}</DialogDescription>
          </DialogHeader>
          <div className={`${BODY} grid grid-cols-1 content-start gap-3 sm:grid-cols-2 [&_input]:h-11 sm:[&_input]:h-10`}>
            <div className="space-y-1"><Label>Prénom</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
            <div className="space-y-1"><Label>Nom</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
            <div className="space-y-1 sm:col-span-2"><Label>Email</Label><Input value={user.email} disabled /><p className="text-xs text-gray-400">L&apos;email est géré par le compte Clerk et n&apos;est pas modifiable ici.</p></div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Rôle</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isSelf && user.role === "ADMIN" && form.role !== "ADMIN" && (
                <p className="text-xs text-red-600">Vous ne pouvez pas retirer votre propre rôle Admin.</p>
              )}
            </div>
            <div className="space-y-1"><Label>Département</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            <div className="space-y-1"><Label>Téléphone</Label><Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></div>
          </div>
          <DialogFooter className={FOOT}>
            <Button variant="outline" onClick={() => setMode(null)} disabled={busy}>Annuler</Button>
            <Button onClick={save} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mode === "delete"} onOpenChange={(o) => !o && !busy && (setMode(null), setBlocked(false))}>
        <DialogContent className={`${SHEET} sm:max-w-md`}>
          {blocked ? (
            <>
              <DialogHeader className={HEAD}>
                <DialogTitle className="flex items-center gap-2 text-amber-700"><UserX className="h-5 w-5" />Suppression impossible</DialogTitle>
                <DialogDescription>
                  <strong>{fullName}</strong> est lié à des données (factures, clients, projets…) qui doivent être conservées.
                </DialogDescription>
              </DialogHeader>
              <div className={BODY}><div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {user.isActive
                  ? "Vous pouvez désactiver ce compte : l’utilisateur ne pourra plus se connecter, ses données restent intactes et le compte pourra être réactivé à tout moment."
                  : "Ce compte est déjà désactivé. Ses données sont conservées."}
              </div></div>
              <DialogFooter className={FOOT}>
                {user.isActive ? (
                  <Button className="bg-amber-600 text-white hover:bg-amber-700" onClick={toggleActive} disabled={busy}>
                    {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserX className="mr-2 h-4 w-4" />}Désactiver ce compte
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => { setMode(null); setBlocked(false); }}>Fermer</Button>
                )}
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader className={HEAD}>
                <DialogTitle className="text-red-600">Supprimer définitivement cet utilisateur ?</DialogTitle>
                <DialogDescription>
                  <strong>{fullName}</strong> ({user.email}) sera supprimé de la base et son compte Clerk sera supprimé. Cette action est irréversible.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className={FOOT}>
                <Button variant="outline" onClick={() => setMode(null)} disabled={busy}>Annuler</Button>
                <Button variant="destructive" onClick={remove} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Supprimer</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={mode === "deactivate"} onOpenChange={(o) => !o && !busy && setMode(null)}>
        <DialogContent className={`${SHEET} sm:max-w-md`}>
          <DialogHeader className={HEAD}>
            <DialogTitle className="text-amber-700">Désactiver ce compte ?</DialogTitle>
            <DialogDescription>
              <strong>{fullName}</strong> ({user.email}) ne pourra plus se connecter ni accéder à l&apos;application. Ses données (factures, clients, projets…) sont conservées et le compte peut être réactivé à tout moment.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className={FOOT}>
            <Button variant="outline" onClick={() => setMode(null)} disabled={busy}>Annuler</Button>
            <Button className="bg-amber-600 text-white hover:bg-amber-700" onClick={toggleActive} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Désactiver</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
