"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  FileDown,
  FileText,
  Flag,
  Forward,
  Landmark,
  ListOrdered,
  Loader2,
  MapPin,
  Pencil,
  Target,
  Users,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { exportRapportActiviteToWord } from "@/lib/assistante/rapport-export-word";
import {
  normalizeReport,
  type StructuredReport,
} from "@/lib/assistante/rapport-structured";
import type { AgendaActivityClient } from "@/lib/assistante/serialize-agenda-activity";
import { cn } from "@/lib/utils";

type Props = {
  activity: AgendaActivityClient;
  rapportSerialized: string;
  updatedAt: string;
};

function tryStructured(s: string): StructuredReport | null {
  if (!s.trim()) return null;
  try {
    return normalizeReport(JSON.parse(s));
  } catch {
    return null;
  }
}

function Section({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-slate-200/90 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <CardHeader className="border-b border-slate-100 bg-slate-50/80 pb-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 space-y-0.5 pt-0.5">
            <CardTitle className="text-base font-semibold text-slate-900">
              {title}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5 text-sm leading-relaxed text-slate-700">
        {children}
      </CardContent>
    </Card>
  );
}

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,9rem)_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="text-slate-900">{value}</dd>
    </div>
  );
}

export function RapportActiviteDetailClient({
  activity,
  rapportSerialized,
  updatedAt,
}: Props) {
  const [exporting, setExporting] = useState(false);
  const structured = tryStructured(rapportSerialized);

  const dateLabel = (() => {
    try {
      return format(parseISO(activity.date), "EEEE d MMMM yyyy", { locale: fr });
    } catch {
      return activity.date;
    }
  })();

  const updatedLabel = (() => {
    try {
      return format(parseISO(updatedAt), "d MMM yyyy 'à' HH:mm", { locale: fr });
    } catch {
      return updatedAt;
    }
  })();

  const onExport = async () => {
    setExporting(true);
    try {
      await exportRapportActiviteToWord({
        titre: activity.titre,
        date: activity.date,
        startTime: activity.startTime,
        endTime: activity.endTime,
        lieuAgenda: activity.lieu,
        rapportSerialized,
      });
      toast.success("Document exporté.");
    } catch (e) {
      console.error(e);
      toast.error("Export impossible.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-slate-100/80 via-slate-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-10">
        <div className="space-y-8">
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 mb-4 h-8 text-slate-600 hover:text-slate-900"
              asChild
            >
              <Link href="/assistante/rapports-activites">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Rapports d&apos;activités
              </Link>
            </Button>

            <Card className="relative overflow-hidden border-slate-200/90 shadow-md">
              <div
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-500"
                aria-hidden
              />
              <CardHeader className="pb-4 pt-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">
                        Rapport d&apos;activité
                      </p>
                      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                        {activity.titre}
                      </h1>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="secondary"
                        className="gap-1.5 border-slate-200 bg-white px-2.5 py-1 font-normal text-slate-700 shadow-sm"
                      >
                        <CalendarClock className="h-3.5 w-3.5 text-indigo-600" />
                        {dateLabel}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="gap-1.5 border-slate-200 bg-white px-2.5 py-1 font-normal text-slate-700 shadow-sm"
                      >
                        {activity.startTime} – {activity.endTime}
                      </Badge>
                      {activity.lieu ? (
                        <Badge
                          variant="secondary"
                          className="gap-1.5 border-slate-200 bg-white px-2.5 py-1 font-normal text-slate-700 shadow-sm"
                        >
                          <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                          {activity.lieu}
                        </Badge>
                      ) : null}
                    </div>
                    <CardDescription className="text-xs text-slate-500">
                      Dernière mise à jour · {updatedLabel}
                    </CardDescription>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                    <Button
                      className="bg-indigo-600 shadow-sm hover:bg-indigo-700"
                      onClick={() => void onExport()}
                      disabled={exporting}
                    >
                      {exporting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileDown className="mr-2 h-4 w-4" />
                      )}
                      Exporter Word
                    </Button>
                    <Button variant="outline" className="border-slate-300" asChild>
                      <Link
                        href={`/assistante/rapport?activityId=${encodeURIComponent(
                          activity.id
                        )}`}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Modifier
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          {activity.description ? (
            <Card className="border-slate-200/90 border-l-4 border-l-indigo-500 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Description de l&apos;activité
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm leading-relaxed text-slate-700">
                  {activity.description}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {structured ? (
            <div className="space-y-5">
              <Section title="En-tête" icon={Landmark}>
                <dl className="space-y-3">
                  <MetaRow
                    label="Lieu"
                    value={structured.header.lieu || "—"}
                  />
                  <Separator />
                  <MetaRow
                    label="Organisateur"
                    value={structured.header.organisateur || "—"}
                  />
                  <Separator />
                  <MetaRow
                    label="Rédacteur"
                    value={structured.header.redacteur || "—"}
                  />
                </dl>
              </Section>

              <Section title="Objectif" icon={Target}>
                <div className="space-y-4">
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Contexte
                    </p>
                    <p className="whitespace-pre-wrap text-slate-800">
                      {structured.objectif.contexte || "—"}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      But principal
                    </p>
                    <p className="whitespace-pre-wrap font-medium text-slate-900">
                      {structured.objectif.butPrincipal || "—"}
                    </p>
                  </div>
                </div>
              </Section>

              <Section title="Participants présents" icon={Users}>
                {structured.participants.presents.length ? (
                  <ul className="flex flex-wrap gap-2">
                    {structured.participants.presents.map((n, i) => (
                      <li key={i}>
                        <Badge
                          variant="outline"
                          className="border-slate-200 bg-white px-2.5 py-1 font-normal text-slate-800"
                        >
                          {n}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500">—</p>
                )}
              </Section>

              {structured.participants.absents.length ? (
                <Section title="Absents" icon={Users}>
                  <ul className="space-y-2">
                    {structured.participants.absents.map((a, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-slate-800"
                      >
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-slate-400"
                          aria-hidden
                        />
                        <span>
                          {a.name}
                          {a.excused ? (
                            <Badge
                              variant="secondary"
                              className="ml-2 align-middle text-[10px] font-normal"
                            >
                              Excusé
                            </Badge>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Section>
              ) : null}

              <Section title="Ordre du jour" icon={ListOrdered}>
                {structured.ordreDuJour.length ? (
                  <ol className="space-y-2">
                    {structured.ordreDuJour.map((o, i) => (
                      <li
                        key={i}
                        className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-800">
                          {i + 1}
                        </span>
                        <span className="pt-0.5 text-slate-800">{o.titre}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-slate-500">—</p>
                )}
              </Section>

              <Section title="Déroulement" icon={Workflow}>
                {structured.deroulement.length ? (
                  <div className="relative space-y-0 border-l-2 border-indigo-100 pl-5">
                    {structured.deroulement.map((d, i) => (
                      <div key={i} className="relative pb-6 last:pb-0">
                        <span className="absolute -left-[calc(0.5rem+5px)] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-indigo-500 shadow-sm" />
                        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                          <p className="font-semibold text-slate-900">
                            {d.titre || `Point ${i + 1}`}
                          </p>
                          {d.resume ? (
                            <p className="mt-2 whitespace-pre-wrap text-slate-700">
                              {d.resume}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">—</p>
                )}
              </Section>

              <Section title="Décisions" icon={CheckCircle2}>
                {structured.decisions.length ? (
                  <ul className="space-y-2">
                    {structured.decisions.map((d, i) => (
                      <li
                        key={i}
                        className="flex gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/40 px-3 py-2.5 text-slate-800"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500">—</p>
                )}
              </Section>

              <Section title="Actions à mener" icon={Flag}>
                {structured.actions.length ? (
                  <ul className="space-y-3">
                    {structured.actions.map((a, i) => (
                      <li
                        key={i}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                      >
                        <p className="font-medium text-slate-900">{a.action}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="font-normal">
                            {a.responsable}
                          </Badge>
                          {a.echeance ? (
                            <span className="text-xs text-slate-600">
                              Échéance : {a.echeance}
                            </span>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500">—</p>
                )}
              </Section>

              <Section title="Difficultés" icon={AlertTriangle}>
                <div className="space-y-4">
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Problèmes
                    </p>
                    <p className="whitespace-pre-wrap text-slate-800">
                      {structured.difficultes.problemes || "—"}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Risques
                    </p>
                    <p className="whitespace-pre-wrap text-slate-800">
                      {structured.difficultes.risques || "—"}
                    </p>
                  </div>
                </div>
              </Section>

              <Section title="Prochaines étapes" icon={Forward}>
                <div className="space-y-4">
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions futures
                    </p>
                    <p className="whitespace-pre-wrap text-slate-800">
                      {structured.prochainesEtapes.actionsFutures || "—"}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date prochaine
                    </p>
                    <p className="text-slate-900">
                      {structured.prochainesEtapes.dateProchaine || "—"}
                    </p>
                  </div>
                </div>
              </Section>

              <Section title="Conclusion" icon={FileText}>
                <p className="whitespace-pre-wrap text-slate-800">
                  {structured.conclusion.resume || "—"}
                </p>
              </Section>
            </div>
          ) : (
            <Card className="border-amber-200/80 bg-amber-50/40 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-amber-950">
                  Contenu non structuré
                </CardTitle>
                <CardDescription className="text-amber-900/80">
                  Ce rapport n&apos;est pas au format JSON attendu, ou est vide.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rapportSerialized.trim() ? (
                  <pre className="max-h-[min(24rem,50vh)] overflow-auto rounded-lg border border-amber-100 bg-white/80 p-4 font-mono text-xs leading-relaxed text-slate-800">
                    {rapportSerialized}
                  </pre>
                ) : (
                  <p className="text-sm text-slate-600">
                    Ce rapport ne contient pas encore de contenu structuré.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
