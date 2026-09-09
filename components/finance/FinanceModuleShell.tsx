"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  FileBarChart,
  FolderKanban,
  ListChecks,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ICONS = {
  projet: FolderKanban,
  taches: ListChecks,
  planning: CalendarDays,
  rapport: FileBarChart,
} as const;

type Props = {
  title: string;
  eyebrow: string;
  description: string;
  icon: keyof typeof ICONS;
  accent: string;
  iconBg: string;
  emptyTitle: string;
  emptyHint: string;
};

export default function FinanceModuleShell({
  title,
  eyebrow,
  description,
  icon,
  accent,
  iconBg,
  emptyTitle,
  emptyHint,
}: Props) {
  const Icon = ICONS[icon];
  return (
    <div className="relative min-h-[calc(100dvh-4rem)] overflow-hidden bg-[#f8fafc]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.08),transparent_28%),linear-gradient(to_bottom,#f8fafc,#ffffff_45%,#f1f5f9)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mb-5 -ml-2 text-slate-600 hover:text-teal-800"
        >
          <Link href="/finance">
            <ArrowLeft className="h-4 w-4" />
            Tableau de bord
          </Link>
        </Button>

        <div className="mb-8 overflow-hidden rounded-3xl border border-slate-100 bg-white/90 shadow-xl shadow-slate-200/40">
          <div className={`h-1 bg-gradient-to-r ${accent}`} />
          <div className="flex flex-col gap-5 px-5 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-8 sm:py-8">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}
              >
                <Icon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {eyebrow}
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  {title}
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                  {description}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Card className="gap-0 overflow-hidden border-0 bg-white/90 py-0 shadow-xl shadow-slate-200/40">
          <div className={`h-1 bg-gradient-to-r ${accent}`} />
          <CardContent className="flex min-h-[320px] flex-col items-center justify-center px-6 py-16 text-center">
            <div
              className={`mb-5 flex h-16 w-16 items-center justify-center rounded-3xl ${iconBg}`}
            >
              <Icon className="h-7 w-7" />
            </div>
            <p className="text-lg font-semibold text-slate-900">{emptyTitle}</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              {emptyHint}
            </p>
            <Button asChild className="mt-6 rounded-xl bg-teal-700 hover:bg-teal-800">
              <Link href="/finance">
                Retour au dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
