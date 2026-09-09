"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Building2,
  CalendarRange,
  Car,
  Eye,
  FileBarChart,
  ListChecks,
  Loader2,
  Target,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getFinanceProjetById,
  type FinanceProjetDetail,
  type FinanceProjetListItem,
} from "@/lib/actions/finance-projet";
import type { StatutFinanceProjet } from "@/lib/finance-projet-statut";

const STATUT_META: Record<
  StatutFinanceProjet,
  { label: string; className: string }
> = {
  BROUILLON: {
    label: "Brouillon",
    className: "border-white/20 bg-white/15 text-white",
  },
  EN_COURS: {
    label: "En cours",
    className: "border-teal-200 bg-teal-50 text-teal-800",
  },
  EN_PAUSE: {
    label: "En pause",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  VALIDE: {
    label: "Validé",
    className: "border-sky-200 bg-sky-50 text-sky-800",
  },
  TERMINE: {
    label: "Terminé",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  ANNULE: {
    label: "Annulé",
    className: "border-rose-200 bg-rose-50 text-rose-800",
  },
};

const ETAPE_LABEL: Record<string, string> = {
  EN_ATTENTE_DEBUT: "En attente de début",
  DEBUT: "Début",
  EN_COURS: "En cours",
  EN_ATTENTE_VALIDATION: "En attente de validation",
  VALIDEE: "Validée",
  TERMINEE: "Terminée",
};

function formatFcfa(value: number | null) {
  if (value == null) return "Non défini";
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} FCFA`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return format(new Date(value), "d MMMM yyyy", { locale: fr });
}

function personName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`.trim();
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Eye;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-100/80 sm:p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-500">{children}</p>;
}

export default function FinanceProjetDetailDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: FinanceProjetListItem | null;
}) {
  const [detail, setDetail] = useState<FinanceProjetDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !project) {
      setDetail(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getFinanceProjetById(project.id)
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setDetail(result.project);
        } else {
          setError(result.error);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger le détail du projet.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, project]);

  const view = detail ?? (project
    ? {
        ...project,
        objectifsDetail: (project.objectifs ?? []).map((titre) => ({
          titre,
          description: null,
        })),
        prospects: [],
        plansActions: [],
        rapports: [],
      }
    : null);

  if (!view) return null;

  const statut = STATUT_META[view.statut];
  const objectifs = detail?.objectifsDetail?.length
    ? detail.objectifsDetail
    : (view.objectifs ?? []).map((titre) => ({ titre, description: null as string | null }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-h-[min(92dvh,880px)] w-[calc(100%-1rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl sm:w-full",
          "top-auto bottom-0 translate-y-0 sm:top-[50%] sm:bottom-auto sm:translate-y-[-50%]",
          "data-[state=open]:slide-in-from-bottom-4 sm:data-[state=open]:slide-in-from-bottom-0",
          "[&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:hover:bg-white/10 [&_[data-slot=dialog-close]]:hover:text-white"
        )}
      >
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-teal-700 via-emerald-700 to-slate-800 px-5 pb-5 pt-6 sm:px-6 sm:pb-6">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.18),transparent_50%)]"
            aria-hidden
          />
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm">
              <Eye className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1 pr-8">
              <DialogTitle className="text-left text-xl font-bold text-white sm:text-2xl">
                {view.nom}
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-left text-sm text-white/85">
                Fiche complète du projet finance
              </DialogDescription>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge className={cn("rounded-full", statut.className)}>
                  {statut.label}
                </Badge>
                {loading ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-white/75">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Actualisation...
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-slate-50/80 to-white px-4 py-4 sm:px-5 sm:py-5">
          {error ? (
            <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {error} Affichage des informations déjà disponibles.
            </p>
          ) : null}

          <div className="space-y-4">
            <Section icon={Eye} title="Description">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {view.description || "Aucune description"}
              </p>
            </Section>

            <Section icon={CalendarRange} title="Calendrier">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Début
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-800">
                    {formatDate(view.dateDebut)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Fin
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-800">
                    {formatDate(view.dateFin)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Créé le
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-800">
                    {formatDate(view.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Mis à jour le
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-800">
                    {formatDate(view.updatedAt)}
                  </dd>
                </div>
              </dl>
            </Section>

            <Section icon={Wallet} title="Objectif de volume d'affaires">
              <p className="text-lg font-semibold tracking-tight text-slate-900">
                {formatFcfa(view.objectifVolumeAffaire)}
              </p>
            </Section>

            <Section icon={Users} title="Commerciaux responsables">
              {view.responsables.length === 0 ? (
                <EmptyLine>Aucun responsable assigné</EmptyLine>
              ) : (
                <ul className="space-y-2">
                  {view.responsables.map((person) => (
                    <li
                      key={person.id}
                      className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-sm font-medium text-slate-800"
                    >
                      <UserRound className="h-4 w-4 text-teal-700" />
                      {personName(person)}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-slate-500">
                Créé par {personName(view.createdBy)}
              </p>
            </Section>

            <Section icon={Car} title="Modèles ciblés">
              {view.modelesCibles.length === 0 ? (
                <EmptyLine>Aucun modèle ciblé</EmptyLine>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {view.modelesCibles.map((modele) => (
                    <li key={modele.id}>
                      <Badge
                        variant="outline"
                        className="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-amber-800"
                      >
                        {modele.model}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section icon={Target} title="Objectifs">
              {objectifs.length === 0 ? (
                <EmptyLine>Aucun objectif renseigné</EmptyLine>
              ) : (
                <ol className="space-y-2">
                  {objectifs.map((objectif, index) => (
                    <li
                      key={`${objectif.titre}-${index}`}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5"
                    >
                      <p className="text-sm font-medium text-slate-800">
                        {index + 1}. {objectif.titre}
                      </p>
                      {objectif.description ? (
                        <p className="mt-1 text-sm text-slate-500">
                          {objectif.description}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </Section>

            <Section icon={Building2} title="Prospects">
              {!detail && loading ? (
                <EmptyLine>Chargement des prospects...</EmptyLine>
              ) : (detail?.prospects.length ?? 0) === 0 ? (
                <EmptyLine>Aucun prospect associé</EmptyLine>
              ) : (
                <ul className="space-y-2">
                  {detail?.prospects.map((prospect, index) => (
                    <li
                      key={`${prospect.nom}-${index}`}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5"
                    >
                      <p className="text-sm font-medium text-slate-800">
                        {prospect.nom}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {prospect.type === "ENTREPRISE" ? "Entreprise" : "Client"}
                        {prospect.telephone ? ` · ${prospect.telephone}` : ""}
                        {prospect.email ? ` · ${prospect.email}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section icon={ListChecks} title="Plans d'actions">
              {!detail && loading ? (
                <EmptyLine>Chargement des plans d&apos;actions...</EmptyLine>
              ) : (detail?.plansActions.length ?? 0) === 0 ? (
                <EmptyLine>Aucun plan d&apos;action</EmptyLine>
              ) : (
                <ul className="space-y-2">
                  {detail?.plansActions.map((plan) => (
                    <li
                      key={plan.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-800">
                          {plan.titre}
                        </p>
                        <Badge variant="outline" className="rounded-full text-[11px]">
                          {ETAPE_LABEL[plan.etapeEnCours] ?? plan.etapeEnCours}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(plan.dateDebut)}
                        {plan.dateFin ? ` → ${formatDate(plan.dateFin)}` : ""}
                        {" · "}
                        {personName(plan.responsable)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {plan.tachesCount} tâche{plan.tachesCount !== 1 ? "s" : ""}
                        {" · "}
                        {plan.acteursCount} acteur{plan.acteursCount !== 1 ? "s" : ""}
                      </p>
                      {plan.resteAExecuter ? (
                        <p className="mt-1 text-sm text-slate-600">
                          Reste à exécuter : {plan.resteAExecuter}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section icon={FileBarChart} title="Rapports">
              {!detail && loading ? (
                <EmptyLine>Chargement des rapports...</EmptyLine>
              ) : (detail?.rapports.length ?? 0) === 0 ? (
                <EmptyLine>Aucun rapport</EmptyLine>
              ) : (
                <ul className="space-y-2">
                  {detail?.rapports.map((rapport) => (
                    <li
                      key={rapport.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5"
                    >
                      <p className="text-sm font-medium text-slate-800">
                        {rapport.titre}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(rapport.createdAt)} · {personName(rapport.auteur)}
                        {rapport.avancement != null
                          ? ` · ${Math.round(rapport.avancement)} %`
                          : ""}
                      </p>
                      {rapport.synthese ? (
                        <p className="mt-1 text-sm text-slate-600">{rapport.synthese}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200/80 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-5">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-slate-200 sm:min-w-[7.5rem]"
              onClick={() => onOpenChange(false)}
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
