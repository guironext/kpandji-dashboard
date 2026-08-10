import React from "react";
import { format, parseISO, isSameMonth, isSameYear } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  Inbox,
  Mail,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAllNumeroCourriers } from "@/lib/actions/courrier";

function formatCourrierDate(iso: string) {
  try {
    return format(parseISO(iso), "d MMM yyyy", { locale: fr });
  } catch {
    return "—";
  }
}

export default async function SuiviMessagesPage() {
  const result = await getAllNumeroCourriers();

  if (!result.success || !result.data) {
    return (
      <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(239,68,68,0.08),transparent)]"
          aria-hidden
        />
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
          <div className="rounded-2xl border border-red-200/80 bg-white/90 p-8 shadow-lg shadow-red-500/5 backdrop-blur-sm">
            <h1 className="text-lg font-semibold text-slate-900">
              Suivi des courriers
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-red-600">
              Impossible de charger les courriers. Vérifiez la connexion ou
              réessayez plus tard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const rows = result.data;
  const now = new Date();
  const thisMonthCount = rows.filter((r) => {
    try {
      const d = parseISO(r.date);
      return isSameMonth(d, now) && isSameYear(d, now);
    } catch {
      return false;
    }
  }).length;
  const uniqueAuthors = new Set(rows.map((r) => r.userId)).size;

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.14),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 top-24 -z-10 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 bottom-32 -z-10 h-64 w-64 rounded-full bg-indigo-100/45 blur-3xl"
        aria-hidden
      />

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <header className="mb-8 md:mb-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-white/85 px-3 py-1 text-xs font-medium text-sky-800 shadow-sm shadow-sky-500/5 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                Espace assistante · Communication
              </div>
              <div>
                <h1 className="text-balance bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
                  Suivi des courriers
                </h1>
                <p className="mt-3 max-w-xl text-pretty text-base leading-relaxed text-slate-600">
                  Vue d’ensemble des numéros de courrier enregistrés. Suivez
                  destinataires, objets et auteurs en un coup d’œil.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2 text-sm shadow-sm">
                  <Inbox className="h-4 w-4 text-indigo-600" />
                  <span className="font-semibold text-slate-900">
                    {rows.length}
                  </span>
                  <span className="text-slate-500">
                    {rows.length <= 1 ? "courrier" : "courriers"}
                  </span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2 text-sm shadow-sm">
                  <Calendar className="h-4 w-4 text-sky-600" />
                  <span className="font-semibold text-slate-900">
                    {thisMonthCount}
                  </span>
                  <span className="text-slate-500">ce mois-ci</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2 text-sm shadow-sm">
                  <Users className="h-4 w-4 text-violet-600" />
                  <span className="font-semibold text-slate-900">
                    {uniqueAuthors}
                  </span>
                  <span className="text-slate-500">
                    {uniqueAuthors <= 1 ? "auteur" : "auteurs"}
                  </span>
                </span>
              </div>
            </div>
            <Button
              asChild
              size="lg"
              className="h-12 shrink-0 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700 hover:shadow-indigo-500/35"
            >
              <Link href="/assistante/numero-courrier">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau courrier
              </Link>
            </Button>
          </div>
        </header>

        {rows.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-b from-white via-white to-slate-50/90 p-12 shadow-xl shadow-slate-200/40 md:p-16">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-100/50 blur-2xl"
              aria-hidden
            />
            <div className="relative mx-auto max-w-md text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 shadow-lg shadow-indigo-500/30">
                <Mail className="h-9 w-9 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Aucun courrier pour l’instant
              </h2>
              <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-600">
                Les enregistrements créés depuis « Numéro de courrier »
                apparaîtront dans ce tableau.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-8 h-11 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700"
              >
                <Link href="/assistante/numero-courrier">
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un courrier
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between gap-3 px-0.5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Registre des courriers
              </h2>
              <p className="text-xs text-slate-400">
                Tri par date d’enregistrement (plus récent en premier)
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-lg shadow-slate-200/50 backdrop-blur-sm">
              <div className="max-h-[min(560px,calc(100vh-20rem))] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="sticky top-0 z-10 border-b border-slate-200/90 bg-slate-50/95 hover:bg-slate-50/95 backdrop-blur-md">
                      <TableHead className="w-[120px] whitespace-nowrap font-semibold text-slate-700">
                        N° courrier
                      </TableHead>
                      <TableHead className="whitespace-nowrap font-semibold text-slate-700">
                        Date
                      </TableHead>
                      <TableHead className="min-w-[140px] font-semibold text-slate-700">
                        Destinataire
                      </TableHead>
                      <TableHead className="min-w-[200px] font-semibold text-slate-700">
                        Objet
                      </TableHead>
                      <TableHead className="min-w-[120px] font-semibold text-slate-700">
                        Rédigé par
                      </TableHead>
                      <TableHead className="min-w-[160px] font-semibold text-slate-700">
                        Compte (BD)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => {
                      const userLabel =
                        row.User?.firstName || row.User?.lastName
                          ? [row.User.firstName, row.User.lastName]
                              .filter(Boolean)
                              .join(" ")
                          : "—";
                      return (
                        <TableRow
                          key={row.id}
                          className="group border-b border-slate-100/90 transition-colors hover:bg-slate-50/90"
                        >
                          <TableCell className="align-middle">
                            <Badge
                              variant="outline"
                              className="border-indigo-200/80 bg-indigo-50/80 font-mono text-xs font-semibold text-indigo-900 shadow-sm"
                              title={row.numero_courrier}
                            >
                              {row.numero_courrier}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className="whitespace-nowrap text-sm tabular-nums text-slate-700"
                            title={formatCourrierDate(row.date)}
                          >
                            {formatCourrierDate(row.date)}
                          </TableCell>
                          <TableCell
                            className="max-w-[200px] truncate text-sm font-medium text-slate-800"
                            title={row.destinataire}
                          >
                            {row.destinataire}
                          </TableCell>
                          <TableCell
                            className="max-w-[300px] truncate text-sm text-slate-600"
                            title={row.objet}
                          >
                            {row.objet}
                          </TableCell>
                          <TableCell
                            className="max-w-[180px] truncate text-sm text-slate-700"
                            title={row.username}
                          >
                            {row.username}
                          </TableCell>
                          <TableCell
                            className="max-w-[220px] text-sm text-slate-600"
                            title={
                              row.User?.email
                                ? `${userLabel} · ${row.User.email}`
                                : userLabel
                            }
                          >
                            <span className="font-medium text-slate-800">
                              {userLabel}
                            </span>
                            {row.User?.email ? (
                              <span className="mt-0.5 block truncate text-xs text-slate-500">
                                {row.User.email}
                              </span>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
