import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import type { InvitationStatus } from "@prisma/client";
import {
  Users, UserCheck, UserX, Clock, Send, BadgeCheck, Mail, ArrowRight,
  CalendarDays, FileText, Fingerprint, ShieldCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getRoleLabel } from "@/lib/role-labels";

export const dynamic = "force-dynamic";

const STATUS: Record<InvitationStatus, { label: string; cls: string }> = {
  PENDING: { label: "Envoyée", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  WAITING_VALIDATION: { label: "À valider", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  ACCEPTED: { label: "Validée", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  REJECTED: { label: "Refusée", cls: "bg-red-50 text-red-700 ring-red-200" },
  REVOKED: { label: "Révoquée", cls: "bg-gray-100 text-gray-600 ring-gray-200" },
};

const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
const initials = (f: string, l: string) => `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase() || "?";

export default async function AdminDashboard() {
  const [me, totalUsers, activeUsers, invByStatus, roleGroups, recentInv, recentUsers] = await Promise.all([
    currentUser(),
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.invitation.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.invitation.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, email: true, role: true, status: true, createdAt: true, expiresAt: true } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true, createdAt: true } }),
  ]);
  const inv = (s: InvitationStatus) => invByStatus.find((g) => g.status === s)?._count._all ?? 0;
  const waiting = inv("WAITING_VALIDATION");
  const roles = roleGroups.map((r) => ({ role: r.role, n: r._count._all })).sort((a, b) => b.n - a.n);
  const maxRole = Math.max(1, ...roles.map((r) => r.n));

  const kpis = [
    { label: "Utilisateurs", value: totalUsers, icon: Users, tone: "bg-gray-900 text-white" },
    { label: "Actifs", value: activeUsers, icon: UserCheck, tone: "bg-emerald-100 text-emerald-700" },
    { label: "Désactivés", value: totalUsers - activeUsers, icon: UserX, tone: "bg-red-100 text-red-700" },
    { label: "À valider", value: waiting, icon: Clock, tone: "bg-amber-100 text-amber-700", highlight: waiting > 0 },
    { label: "Invitations envoyées", value: inv("PENDING"), icon: Send, tone: "bg-sky-100 text-sky-700" },
    { label: "Invitations validées", value: inv("ACCEPTED"), icon: BadgeCheck, tone: "bg-indigo-100 text-indigo-700" },
  ];

  const soon = [
    { label: "Pointage", icon: Fingerprint },
    { label: "Agenda", icon: CalendarDays },
    { label: "Rapports", icon: FileText },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 overflow-x-hidden px-3 py-4 sm:px-6 sm:py-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl bg-gray-900 p-5 text-white shadow-lg sm:p-7">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/20 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <ShieldCheck className="h-4 w-4" /> Administration
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Bonjour{me?.firstName ? `, ${me.firstName}` : ""} 👋
            </h1>
            <p className="mt-1 text-sm text-gray-300">Tableau de bord — vue d’ensemble des comptes et des invitations.</p>
          </div>
          <Link href="/admin/invitations" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-semibold text-gray-900 shadow hover:bg-amber-400">
            <Mail className="h-4 w-4" /> Inviter un utilisateur
          </Link>
        </div>
      </section>

      {waiting > 0 && (
        <Link href="/admin/invitations" className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 hover:bg-amber-100">
          <span className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0" /> {waiting} compte{waiting > 1 ? "s" : ""} en attente de validation</span>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
      )}

      {/* KPIs */}
      <section className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map(({ label, value, icon: Icon, tone, highlight }) => (
          <div key={label} className={`rounded-2xl border bg-white p-4 shadow-sm ${highlight ? "border-amber-300 ring-2 ring-amber-100" : "border-gray-200"}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">{label}</span>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span>
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick actions */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-semibold text-gray-900">Actions rapides</h2>
          <div className="mt-4 space-y-2">
            <Link href="/admin/invitations" className="flex min-h-14 items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 hover:bg-amber-100">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-gray-900"><Mail className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-gray-900">Invitations & utilisateurs</span>
                <span className="block text-xs text-gray-600">Inviter, valider, modifier, désactiver</span>
              </span>
              <ArrowRight className="h-4 w-4 text-amber-700" />
            </Link>
            {soon.map(({ label, icon: Icon }) => (
              <div key={label} className="flex min-h-14 items-center gap-3 rounded-xl border border-dashed border-gray-200 p-3 text-gray-400">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100"><Icon className="h-5 w-5" /></span>
                <span className="flex-1 text-sm font-medium">{label}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">Bientôt</span>
              </div>
            ))}
          </div>
        </section>

        {/* Roles */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Répartition par rôle</h2>
            <span className="text-xs text-gray-500">{totalUsers} au total</span>
          </div>
          {roles.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">Aucun utilisateur.</p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {roles.map((r) => (
                <li key={r.role} className="min-w-0">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-gray-700">{getRoleLabel(r.role)}</span>
                    <span className="font-semibold text-gray-900">{r.n}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-600" style={{ width: `${(r.n / maxRole) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Recent invitations */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-4 sm:p-5">
            <h2 className="text-base font-semibold text-gray-900">Dernières invitations</h2>
            <Link href="/admin/invitations" className="inline-flex min-h-9 items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800">Tout voir <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {recentInv.length === 0 ? (
            <p className="p-5 text-sm text-gray-500">Aucune invitation pour le moment.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentInv.map((i) => (
                <li key={i.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{i.email}</p>
                    <p className="text-xs text-gray-500">{getRoleLabel(i.role)} · {fmt(i.createdAt)}</p>
                  </div>
                  <span className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${STATUS[i.status].cls}`}>{STATUS[i.status].label}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent users */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-4 sm:p-5">
            <h2 className="text-base font-semibold text-gray-900">Derniers utilisateurs</h2>
            <Link href="/admin/invitations" className="inline-flex min-h-9 items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800">Gérer <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {recentUsers.length === 0 ? (
            <p className="p-5 text-sm text-gray-500">Aucun utilisateur.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-3 p-4 sm:px-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-amber-400">{initials(u.firstName, u.lastName)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                    <p className="truncate text-xs text-gray-500">{u.email}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">{getRoleLabel(u.role)}</span>
                    <span className={`text-[11px] font-medium ${u.isActive ? "text-emerald-600" : "text-red-600"}`}>{u.isActive ? "Actif" : "Désactivé"} · {fmt(u.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
