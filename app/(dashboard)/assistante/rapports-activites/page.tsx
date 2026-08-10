import React from "react";
import Link from "next/link";
import { CalendarDays, FileStack, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { loadRapportsActivitesList } from "@/lib/assistante/load-rapports-activites";
import { RapportsActivitesTable } from "./RapportsActivitesTable";

export const dynamic = "force-dynamic";

export default async function RapportsActivitesPage() {
  const list = await loadRapportsActivitesList();
  if (list.status === "unauthorized") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <p className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
          Vous devez être connecté pour voir les rapports.
        </p>
      </div>
    );
  }

  const count = list.rows.length;

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 top-24 -z-10 h-72 w-72 rounded-full bg-violet-200/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 bottom-0 -z-10 h-64 w-64 rounded-full bg-indigo-100/40 blur-3xl"
        aria-hidden
      />

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        {/* Hero header */}
        <header className="mb-8 md:mb-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-white/80 px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm shadow-indigo-500/5 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                Espace assistante
              </div>
              <div>
                <h1 className="text-balance bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
                  Rapports d’activité
                </h1>
                <p className="mt-3 max-w-xl text-pretty text-base leading-relaxed text-slate-600">
                  Retrouvez les comptes rendus liés à votre agenda. Consultation,
                  modification ou suppression en un clic.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2 text-sm shadow-sm">
                  <FileStack className="h-4 w-4 text-indigo-600" />
                  <span className="font-semibold text-slate-900">{count}</span>
                  <span className="text-slate-500">
                    {count <= 1 ? "rapport" : "rapports"}
                  </span>
                </span>
              </div>
            </div>
            <Button
              asChild
              size="lg"
              className="h-12 shrink-0 rounded-xl border-slate-200/80 bg-white text-slate-800 shadow-md transition hover:bg-slate-50 hover:shadow-lg"
              variant="outline"
            >
              <Link href="/assistante/agenda">
                <CalendarDays className="mr-2 h-4 w-4 text-indigo-600" />
                Ouvrir l’agenda
              </Link>
            </Button>
          </div>
        </header>

        <RapportsActivitesTable initialRows={list.rows} />
      </div>
    </div>
  );
}
