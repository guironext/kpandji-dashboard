import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Building2, Sparkles, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getClientsByStatusWithCommandes } from "@/lib/actions/client";
import { getClientEntreprisesByStatusWithCommandes } from "@/lib/actions/client_entreprise";

type CommandeSummary = {
  id: string;
  etapeCommande: string;
  modelLabel: string;
  dateLivraison: Date;
};

function normalizeCommandes(raw: unknown): CommandeSummary[] {
  const list = raw as unknown[] | undefined;
  if (!Array.isArray(list)) return [];
  return list.map((cmd) => {
    const c = cmd as Record<string, unknown>;
    const vm = c.VoitureModel as { model?: string } | null | undefined;
    const dl = c.date_livraison;
    const dateLivraison =
      dl instanceof Date
        ? dl
        : dl != null && String(dl).length > 0
          ? new Date(String(dl))
          : new Date(NaN);
    return {
      id: c.id as string,
      etapeCommande: String(c.etapeCommande ?? ""),
      modelLabel: vm?.model?.trim() ? vm.model : "Modèle N/A",
      dateLivraison,
    };
  });
}

function formatLivraison(d: Date) {
  try {
    return format(d, "d MMM yyyy", { locale: fr });
  } catch {
    return "—";
  }
}

type RepRow =
  | {
      kind: "particulier";
      id: string;
      nom: string;
      telephone: string;
      entreprise: string | null;
      secteur: string | null;
      commercial: string | null;
      commandes: CommandeSummary[];
    }
  | {
      kind: "entreprise";
      id: string;
      nom: string;
      telephone: string;
      contact: string | null;
      secteur: string | null;
      commercial: string | null;
      commandes: CommandeSummary[];
    };

export default async function RepertoireClientsPage() {
  const [clientsRes, entreprisesRes] = await Promise.all([
    getClientsByStatusWithCommandes("CLIENT"),
    getClientEntreprisesByStatusWithCommandes("CLIENT"),
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
              Répertoire clients
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-red-600">
              Impossible de charger les clients. Vérifiez la connexion ou
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
      commandes: normalizeCommandes(c.Commande),
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
      commandes: normalizeCommandes(ce.Commande),
    })
  );

  const typeOrder = { particulier: 0, entreprise: 1 } as const;
  const rows = [...particuliers, ...entreprises].sort((a, b) => {
    const byType = typeOrder[a.kind] - typeOrder[b.kind];
    if (byType !== 0) return byType;
    return a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" });
  });

  const nPart = rows.filter((r) => r.kind === "particulier").length;
  const nEnt = rows.filter((r) => r.kind === "entreprise").length;

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
                Espace assistante · Clients
              </div>
              <div>
                <h1 className="text-balance bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
                  Répertoire clients
                </h1>
                <p className="mt-3 max-w-xl text-pretty text-base leading-relaxed text-slate-600">
                  Clients au statut « client » ayant au moins une commande
                  (particuliers et entreprises).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2 text-sm shadow-sm">
                  <Users className="h-4 w-4 text-indigo-600" />
                  <span className="font-semibold text-slate-900">
                    {rows.length}
                  </span>
                  <span className="text-slate-500">au total</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2 text-sm shadow-sm">
                  <Users className="h-4 w-4 text-sky-600" />
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
              className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-100/50 blur-2xl"
              aria-hidden
            />
            <div className="relative mx-auto max-w-md text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 shadow-lg shadow-indigo-500/30">
                <Users className="h-9 w-9 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Aucun client avec commande
              </h2>
              <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-600">
                Seuls les clients « client » disposant d’au moins une commande
                sont listés ici.
              </p>
            </div>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between gap-3 px-0.5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Annuaire
              </h2>
              <p className="text-xs text-slate-400">
                Tri par type (particulier, entreprise), puis par nom
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-lg shadow-slate-200/50 backdrop-blur-sm">
              <div className="max-h-[min(640px,calc(100vh-18rem))] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="sticky top-0 z-10 border-b border-slate-200/90 bg-slate-50/95 hover:bg-slate-50/95 backdrop-blur-md">
                      <TableHead className="w-[110px] whitespace-nowrap font-semibold text-slate-700">
                        Type
                      </TableHead>
                      <TableHead className="min-w-[140px] font-semibold text-slate-700">
                        Nom
                      </TableHead>
                      <TableHead className="whitespace-nowrap font-semibold text-slate-700">
                        Téléphone
                      </TableHead>
                      <TableHead className="min-w-[120px] font-semibold text-slate-700">
                        Secteur
                      </TableHead>
                      <TableHead className="min-w-[100px] font-semibold text-slate-700">
                        Commercial
                      </TableHead>
                      <TableHead className="min-w-[220px] font-semibold text-slate-700">
                        Commande
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
                        <TableCell className="whitespace-nowrap text-sm tabular-nums text-slate-700">
                          {row.telephone}
                        </TableCell>
                        <TableCell className="max-w-[140px] truncate text-sm text-slate-600">
                          {row.secteur ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-[140px] truncate text-sm text-slate-600">
                          {row.commercial ?? "—"}
                        </TableCell>
                        <TableCell className="min-w-[220px] max-w-[320px] align-top">
                          <ul className="flex flex-col gap-2 py-0.5">
                            {row.commandes.map((cmd) => (
                              <li
                                key={cmd.id}
                                className="rounded-lg border border-slate-100 bg-slate-50/80 px-2 py-1.5 text-xs leading-snug"
                              >
                                <div className="font-medium text-slate-800">
                                  {cmd.modelLabel}
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-slate-600">
                                  <Badge
                                    variant="outline"
                                    className="h-5 border-amber-200/90 bg-amber-50/90 px-1.5 text-[10px] font-medium text-amber-950"
                                  >
                                    {cmd.etapeCommande}
                                  </Badge>
                                  <span className="tabular-nums text-slate-500">
                                    Livr. {formatLivraison(cmd.dateLivraison)}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
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
