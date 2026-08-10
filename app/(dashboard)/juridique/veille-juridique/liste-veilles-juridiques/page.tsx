import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight, FolderOpen, Newspaper, Sparkles } from "lucide-react";
import DossiersVeilleJuridiqueTab from "@/components/juridique/DossiersVeilleJuridiqueTab";
import { Button } from "@/components/ui/button";
import { getDossiersVeilleJuridique } from "@/lib/actions/veille-juridique";

async function ListeVeillesJuridiquesContent() {
  const result = await getDossiersVeilleJuridique();
  const dossiers = result.data ?? [];
  const enCours = dossiers.filter((d) => d.dateCloture === null).length;

  return (
    <div className="min-h-full bg-slate-50/80">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950 to-indigo-950" />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(124,58,237,0.28),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(99,102,241,0.24),transparent_28%),radial-gradient(circle_at_70%_80%,rgba(52,211,153,0.1),transparent_30%)]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pb-28 sm:pt-8 lg:px-8 lg:pb-32">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-violet-100 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                Service Juridique · Veille
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 shadow-2xl ring-1 ring-white/20 backdrop-blur-md">
                  <Newspaper className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                    Liste des veilles juridiques
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                    Consultez et gérez l&apos;ensemble de vos dossiers de veille juridique.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur-sm">
                  <FolderOpen className="h-3.5 w-3.5 text-violet-300" />
                  {dossiers.length} dossier{dossiers.length !== 1 ? "s" : ""} au total
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-xs font-medium text-sky-100">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
                  </span>
                  {enCours} en cours
                </span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col">
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full rounded-2xl border-white/15 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <Link href="/juridique/veille-juridique">
                  Espace veille juridique
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="-mt-16">
          <DossiersVeilleJuridiqueTab dossiers={dossiers} />
        </div>
      </div>
    </div>
  );
}

function ListeVeillesJuridiquesFallback() {
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
        <div className="-mt-16 h-96 animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>
    </div>
  );
}

export default function ListeVeillesJuridiquesPage() {
  return (
    <Suspense fallback={<ListeVeillesJuridiquesFallback />}>
      <ListeVeillesJuridiquesContent />
    </Suspense>
  );
}
