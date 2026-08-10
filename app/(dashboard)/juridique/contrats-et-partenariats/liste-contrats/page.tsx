import { Suspense } from "react";
import ContratsPartenariatsClient from "@/components/juridique/ContratsPartenariatsClient";
import {
  getContratsEtPartenariats,
  getPartenairesSignataires,
} from "@/lib/actions/contrats-partenariats";

async function ListeContratsContent() {
  const [contratsResult, partenairesResult] = await Promise.all([
    getContratsEtPartenariats(),
    getPartenairesSignataires(),
  ]);

  return (
    <ContratsPartenariatsClient
      variant="registre"
      contrats={contratsResult.data ?? []}
      partenaires={partenairesResult.data ?? []}
    />
  );
}

function ListeContratsFallback() {
  return (
    <div className="min-h-full bg-slate-50/80">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-violet-950 to-indigo-950 px-4 pb-24 pt-8 sm:px-6 sm:pb-28 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="h-7 w-52 animate-pulse rounded-full bg-white/10" />
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 animate-pulse rounded-2xl bg-white/10" />
            <div className="space-y-3">
              <div className="h-9 w-72 animate-pulse rounded-xl bg-white/10 sm:w-96" />
              <div className="h-4 w-64 animate-pulse rounded-lg bg-white/10" />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-16 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-white shadow-xl shadow-slate-200/50 sm:h-28"
            />
          ))}
        </div>
        <div className="mt-8 h-96 animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>
    </div>
  );
}

export default function ListeContratsPage() {
  return (
    <Suspense fallback={<ListeContratsFallback />}>
      <ListeContratsContent />
    </Suspense>
  );
}
