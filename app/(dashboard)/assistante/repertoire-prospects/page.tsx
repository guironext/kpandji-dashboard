import React from "react";
import { Building2, Sparkles, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getClientsByStatus } from "@/lib/actions/client";
import { getClientEntreprisesByStatus } from "@/lib/actions/client_entreprise";

type RepRow =
  | {
      kind: "particulier";
      id: string;
      nom: string;
      telephone: string;
      entreprise: string | null;
      secteur: string | null;
      commercial: string | null;
      localisation: string | null;
    }
  | {
      kind: "entreprise";
      id: string;
      nom: string;
      telephone: string;
      contact: string | null;
      secteur: string | null;
      commercial: string | null;
      localisation: string | null;
    };

export default async function RepertoireProspectsPage() {
  const [clientsRes, entreprisesRes] = await Promise.all([
    getClientsByStatus("PROSPECT"),
    getClientEntreprisesByStatus("PROSPECT"),
  ]);

  if (!clientsRes.success || !entreprisesRes.success) {
    return (
      <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(239,68,68,0.08),transparent)]"
          aria-hidden
        />
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
          <div className="rounded-2xl border border-red-200/80 bg-white/90 p-8 shadow-lg shadow-red-500/5 backdrop-blur-sm">
            <h1 className="text-lg font-semibold text-slate-900">
              Répertoire prospects
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-red-600">
              Impossible de charger les prospects. Vérifiez la connexion ou
              réessayez plus tard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const particuliers: RepRow[] = (clientsRes.data ?? []).map(
    (c: Record<string, unknown>) => ({
      kind: "particulier" as const,
      id: c.id as string,
      nom: c.nom as string,
      telephone: c.telephone as string,
      entreprise: (c.entreprise as string | null) ?? null,
      secteur: (c.secteur_activite as string | null) ?? null,
      commercial: (c.commercial as string | null) ?? null,
      localisation: (c.localisation as string | null) ?? null,
    })
  );

  const entreprises: RepRow[] = (entreprisesRes.data ?? []).map(
    (ce: Record<string, unknown>) => ({
      kind: "entreprise" as const,
      id: ce.id as string,
      nom: ce.nom_entreprise as string,
      telephone: ce.telephone as string,
      contact: (ce.nom_personne_contact as string | null) ?? null,
      secteur: (ce.secteur_activite as string | null) ?? null,
      commercial: (ce.commercial as string | null) ?? null,
      localisation: (ce.localisation as string | null) ?? null,
    })
  );

  const rows = [...particuliers, ...entreprises].sort((a, b) =>
    a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" })
  );

  const nPart = rows.filter((r) => r.kind === "particulier").length;
  const nEnt = rows.filter((r) => r.kind === "entreprise").length;

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(245,158,11,0.12),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 top-24 -z-10 h-72 w-72 rounded-full bg-amber-100/40 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 bottom-32 -z-10 h-64 w-64 rounded-full bg-orange-100/35 blur-3xl"
        aria-hidden
      />

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <header className="mb-8 md:mb-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-white/85 px-3 py-1 text-xs font-medium text-amber-900 shadow-sm shadow-amber-500/5 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                Espace assistante · Prospects
              </div>
              <div>
                <h1 className="text-balance bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
                  Répertoire prospects
                </h1>
                <p className="mt-3 max-w-xl text-pretty text-base leading-relaxed text-slate-600">
                  Tous les contacts au statut « prospect » (particuliers et
                  entreprises).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2 text-sm shadow-sm">
                  <UserPlus className="h-4 w-4 text-amber-600" />
                  <span className="font-semibold text-slate-900">
                    {rows.length}
                  </span>
                  <span className="text-slate-500">au total</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2 text-sm shadow-sm">
                  <UserPlus className="h-4 w-4 text-sky-600" />
                  <span className="font-semibold text-slate-900">{nPart}</span>
                  <span className="text-slate-500">particuliers</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2 text-sm shadow-sm">
                  <Building2 className="h-4 w-4 text-violet-600" />
                  <span className="font-semibold text-slate-900">{nEnt}</span>
                  <span className="text-slate-500">entreprises</span>
                </span>
              </div>
            </div>
          </div>
        </header>

        {rows.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-b from-white via-white to-slate-50/90 p-12 shadow-xl shadow-slate-200/40 md:p-16">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-amber-100/50 blur-2xl"
              aria-hidden
            />
            <div className="relative mx-auto max-w-md text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
                <UserPlus className="h-9 w-9 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Aucun prospect en base
              </h2>
              <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-600">
                Les fiches avec le statut « prospect » apparaîtront ici.
              </p>
            </div>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between gap-3 px-0.5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Annuaire
              </h2>
              <p className="text-xs text-slate-400">Tri alphabétique par nom</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-lg shadow-slate-200/50 backdrop-blur-sm">
              <div className="max-h-[min(640px,calc(100vh-18rem))] overflow-auto">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow className="sticky top-0 z-10 border-b border-slate-200/90 bg-slate-50/95 hover:bg-slate-50/95 backdrop-blur-md">
                      <TableHead className="w-[110px] whitespace-nowrap font-semibold text-slate-700">
                        Type
                      </TableHead>
                      <TableHead className="min-w-[140px] font-semibold text-slate-700">
                        Nom
                      </TableHead>
                      <TableHead className="w-32 min-w-32 max-w-32 whitespace-normal font-semibold text-slate-700">
                        Téléphone
                      </TableHead>
                      <TableHead className="min-w-[120px] font-semibold text-slate-700">
                        Secteur
                      </TableHead>
                      <TableHead className="min-w-[100px] font-semibold text-slate-700">
                        Commercial
                      </TableHead>
                      <TableHead className="min-w-[120px] font-semibold text-slate-700">
                        Localisation
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow
                        key={`${row.kind}-${row.id}`}
                        className="group border-b border-slate-100/90 transition-colors hover:bg-slate-50/90"
                      >
                        <TableCell className="align-middle">
                          <Badge
                            variant="outline"
                            className={
                              row.kind === "entreprise"
                                ? "border-violet-200/80 bg-violet-50/80 text-xs font-medium text-violet-900"
                                : "border-sky-200/80 bg-sky-50/80 text-xs font-medium text-sky-900"
                            }
                          >
                            {row.kind === "entreprise"
                              ? "Entreprise"
                              : "Particulier"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          <div
                            className="truncate text-sm font-medium text-slate-800"
                            title={row.nom}
                          >
                            {row.nom}
                          </div>
                          {row.kind === "particulier" &&
                            row.entreprise != null &&
                            row.entreprise !== "" && (
                              <div
                                className="truncate text-xs text-slate-500"
                                title={row.entreprise}
                              >
                                {row.entreprise}
                              </div>
                            )}
                          {row.kind === "entreprise" &&
                            row.contact != null &&
                            row.contact !== "" && (
                              <div
                                className="truncate text-xs text-slate-500"
                                title={row.contact}
                              >
                                Contact : {row.contact}
                              </div>
                            )}
                        </TableCell>
                        <TableCell className="w-32 min-w-0 max-w-32 whitespace-normal break-all text-sm leading-relaxed tabular-nums text-slate-700 align-top">
                          {row.telephone}
                        </TableCell>
                        <TableCell className="max-w-[140px] truncate text-sm text-slate-600">
                          {row.secteur ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-[140px] truncate text-sm text-slate-600">
                          {row.commercial ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate text-sm text-slate-600">
                          {row.localisation?.trim() ? row.localisation : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
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
