import { Suspense } from "react";
import ContentieuxListeClient from "@/components/juridique/ContentieuxListeClient";
import { getDossiersContentieuxListe } from "@/lib/actions/contentieux";

async function ListeContentieuxContent() {
  const result = await getDossiersContentieuxListe();
  const dossiers = result.data ?? [];

  return <ContentieuxListeClient dossiers={dossiers} />;
}

function ListeContentieuxFallback() {
  return (
    <div className="min-h-full bg-slate-50/80">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-violet-950 to-indigo-950 px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="h-6 w-48 animate-pulse rounded-full bg-white/10" />
          <div className="h-10 w-72 animate-pulse rounded-xl bg-white/10" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-white/10" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-white shadow-xl shadow-slate-200/50"
            />
          ))}
        </div>
        <div className="mt-8 space-y-4 pb-12">
          <div className="h-24 animate-pulse rounded-2xl bg-white shadow-sm" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ListeContentieuxPage() {
  return (
    <Suspense fallback={<ListeContentieuxFallback />}>
      <ListeContentieuxContent />
    </Suspense>
  );
}
