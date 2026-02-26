import React from "react";
import { ObjectifsSummaryTable } from "./ObjectifsSummaryTable";

export default function ObjectifsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/80">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-10">
          <div className="flex items-baseline gap-3">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
              Commercial
            </span>
            <span className="text-muted-foreground/60">/</span>
            <span className="text-muted-foreground text-sm">Objectifs</span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Mes objectifs
          </h1>
          <p className="mt-1 max-w-2xl text-slate-600">
            Vue d&apos;ensemble de vos performances par période — objectifs, prospects et ventes.
          </p>
        </header>

        <ObjectifsSummaryTable />
      </div>
    </div>
  );
}
